import { prisma } from "@/lib/db/prisma";

export type RateLimitResult = { allowed: boolean; count: number; retryAfterSeconds: number };

// Compte un passage pour une clé dans une fenêtre de temps fixe (ex. 10 min)
// et dit s'il reste sous la limite. Stocké en base (RateLimitCounter) : un
// compteur en mémoire serait remis à zéro à chaque instance serverless.
export async function hitRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  const row = await incrementCounter(key, windowStart);

  // Nettoyage occasionnel des vieilles fenêtres, au début d'une nouvelle
  // fenêtre seulement, pour ne pas faire grossir la table indéfiniment.
  if (row.count === 1 && Math.random() < 0.05) {
    await prisma.rateLimitCounter
      .deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) } } })
      .catch(() => undefined);
  }

  return {
    allowed: row.count <= limit,
    count: row.count,
    retryAfterSeconds: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000)),
  };
}

async function incrementCounter(key: string, windowStart: Date) {
  const upsert = () =>
    prisma.rateLimitCounter.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });

  try {
    return await upsert();
  } catch {
    // Deux requêtes simultanées peuvent créer la même ligne en même temps :
    // la seconde échoue sur la clé unique, un nouvel essai incrémente.
    return upsert();
  }
}

// Adresse IP du visiteur telle que transmise par Vercel. Null en local et en
// test (pas d'en-tête), où la limitation par IP ne s'applique pas.
export function getClientIp(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

// Limites par IP des routes sensibles. "claude" : routes qui peuvent appeler
// Claude (assez large pour un ajout en masse d'un long texte, une requête
// par mot) ; "owner-unlock" : essais de mot de passe propriétaire ; "auth" :
// connexions et inscriptions (essais de mot de passe d'un compte).
const IP_LIMITS = {
  claude: { limit: 200, windowSeconds: 10 * 60 },
  "owner-unlock": { limit: 10, windowSeconds: 15 * 60 },
  auth: { limit: 20, windowSeconds: 15 * 60 },
} as const;

export type IpLimitBucket = keyof typeof IP_LIMITS;

// À appeler au début d'une route : renvoie une réponse 429 si l'IP a dépassé
// sa limite, sinon null (la route continue normalement).
export async function limitByIp(request: Request, bucket: IpLimitBucket): Promise<Response | null> {
  const ip = getClientIp(request);

  if (!ip) {
    return null;
  }

  const { limit, windowSeconds } = IP_LIMITS[bucket];
  const result = await hitRateLimit(`ip:${bucket}:${ip}`, limit, windowSeconds);

  if (result.allowed) {
    return null;
  }

  const minutes = Math.ceil(result.retryAfterSeconds / 60);
  return Response.json(
    { error: `Trop de requêtes. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.` },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}
