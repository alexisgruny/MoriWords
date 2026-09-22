import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { deckId } = await params;

    const deck = await prisma.deck.findUnique({ where: { id: deckId } });

    if (!deck) {
      return Response.json({ error: "Deck introuvable." }, { status: 404 });
    }

    const [totalCards, dueCards, totalReviews, successfulReviews, recentLogs] = await Promise.all([
      prisma.card.count({ where: { deckId } }),
      prisma.card.count({ where: { deckId, dueAt: { lte: new Date() } } }),
      prisma.reviewLog.count({ where: { card: { deckId } } }),
      prisma.reviewLog.count({ where: { card: { deckId }, quality: { gte: 3 } } }),
      prisma.reviewLog.findMany({
        where: { card: { deckId } },
        orderBy: { reviewedAt: "desc" },
        take: 20,
        include: { card: { select: { lemma: true } } },
      }),
    ]);

    return Response.json({
      totalCards,
      dueCards,
      totalReviews,
      successRate: totalReviews > 0 ? successfulReviews / totalReviews : null,
      recentReviews: recentLogs.map((log) => ({
        id: log.id,
        lemma: log.card.lemma,
        quality: log.quality,
        reviewedAt: log.reviewedAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch deck stats:", error);
    return Response.json(
      { error: "Impossible de récupérer les statistiques du deck." },
      { status: 500 },
    );
  }
}
