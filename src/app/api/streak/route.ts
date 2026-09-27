import { prisma } from "@/lib/db/prisma";
import { computeStreak } from "@/lib/srs/streak";

// Renvoie la série de jours consécutifs de révision (tous decks confondus).
// Ne charge que la colonne reviewedAt : suffisant pour regrouper par jour,
// et léger même quand l'historique grandit.
export async function GET() {
  try {
    const logs = await prisma.reviewLog.findMany({ select: { reviewedAt: true } });

    return Response.json(computeStreak(logs.map((log) => log.reviewedAt)));
  } catch (error) {
    console.error("Failed to compute streak:", error);
    return Response.json({ error: "Impossible de calculer la série de révisions." }, { status: 500 });
  }
}
