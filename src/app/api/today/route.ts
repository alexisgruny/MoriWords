import { requireUser } from "@/lib/auth/session";
import { getTodaySummary } from "@/lib/srs/today";

// Résumé du jour pour l'accueil : cartes à réviser, série, progression.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    return Response.json(await getTodaySummary(user.id));
  } catch (error) {
    console.error("Failed to load today summary:", error);
    return Response.json({ error: "Impossible de charger le programme du jour." }, { status: 500 });
  }
}
