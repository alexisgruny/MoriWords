import { auth } from "@/lib/auth/auth";

export type CurrentUser = { id: string; email: string };

// À appeler au début de chaque route : renvoie l'utilisateur connecté, ou une
// réponse 401 à renvoyer telle quelle. Une session illisible compte comme
// « non connecté » plutôt que comme une erreur serveur.
export async function requireUser(request: Request): Promise<CurrentUser | Response> {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);

  if (!session) {
    return Response.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  }

  return { id: session.user.id, email: session.user.email };
}
