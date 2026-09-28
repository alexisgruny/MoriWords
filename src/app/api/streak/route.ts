import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { computeStreak } from "@/lib/srs/streak";

// Renvoie la série de jours consécutifs de révision (tous les decks de l'utilisateur).
// Ne charge que la colonne reviewedAt : suffisant pour regrouper par jour,
// et léger même quand l'historique grandit.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const logs = await prisma.reviewLog.findMany({
      where: { card: { deck: { userId: user.id } } },
      select: { reviewedAt: true },
    });

    return Response.json(computeStreak(logs.map((log) => log.reviewedAt)));
  } catch (error) {
    console.error("Failed to compute streak:", error);
    return Response.json({ error: "Impossible de calculer la série de révisions." }, { status: 500 });
  }
}
