import { auth } from "@/lib/auth/auth";

export type CurrentUser = { id: string; email: string };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Une modification (POST, PATCH, DELETE) doit venir du site lui-même. Le
// cookie de session (SameSite=Lax) bloque déjà les requêtes d'autres sites ;
// ce contrôle est une seconde barrière contre le CSRF. Les navigateurs
// envoient toujours Origin sur ces méthodes ; son absence (appel serveur,
// tests) n'est pas refusée.
export function isCrossSiteWrite(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return false;
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.BETTER_AUTH_URL) {
    allowed.add(new URL(process.env.BETTER_AUTH_URL).origin);
  }
  return !allowed.has(origin);
}

// À appeler au début de chaque route : renvoie l'utilisateur connecté, ou une
// réponse d'erreur à renvoyer telle quelle. Une session illisible compte comme
// « non connecté » plutôt que comme une erreur serveur.
export async function requireUser(request: Request): Promise<CurrentUser | Response> {
  if (isCrossSiteWrite(request)) {
    return Response.json({ error: "Requête refusée." }, { status: 403 });
  }

  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);

  if (!session) {
    return Response.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  }

  return { id: session.user.id, email: session.user.email };
}
