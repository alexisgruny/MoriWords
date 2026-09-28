import { createHmac, timingSafeEqual } from "node:crypto";

// Protection temporaire des actions destructrices (supprimer, renommer,
// modifier, déplacer) tant que le site n'a pas de comptes utilisateurs : le
// propriétaire saisit OWNER_SECRET une fois sur /proprietaire, ce qui pose
// un cookie signé. À remplacer par une vraie authentification plus tard.

export const OWNER_COOKIE = "moriwords_owner";
export const OWNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type Env = Partial<Record<"NODE_ENV" | "OWNER_SECRET", string>>;

// Le cookie contient une signature dérivée du secret, jamais le secret.
export function ownerCookieValue(secret: string): string {
  return createHmac("sha256", secret).update("moriwords-owner-session").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isOwnerSecret(candidate: string, env: Env = process.env): boolean {
  const secret = env.OWNER_SECRET;
  return Boolean(secret) && safeEqual(candidate, secret as string);
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";

  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

// En local et en test (NODE_ENV différent de "production"), tout est permis :
// le site n'y est pas exposé. En production, sans OWNER_SECRET configuré,
// personne ne peut rien supprimer (on préfère bloquer que laisser ouvert).
export function isOwnerRequest(request: Request, env: Env = process.env): boolean {
  if (env.NODE_ENV !== "production") {
    return true;
  }

  const secret = env.OWNER_SECRET;
  const cookie = readCookie(request, OWNER_COOKIE);

  return Boolean(secret) && cookie !== null && safeEqual(cookie, ownerCookieValue(secret as string));
}

export const OWNER_ONLY_MESSAGE =
  "Action réservée au propriétaire du site. Déverrouille-la depuis la page /proprietaire.";

// À appeler au début d'une route destructrice : renvoie une réponse 403 si
// la requête ne vient pas du propriétaire, sinon null.
export function requireOwner(request: Request, env: Env = process.env): Response | null {
  return isOwnerRequest(request, env) ? null : Response.json({ error: OWNER_ONLY_MESSAGE }, { status: 403 });
}
