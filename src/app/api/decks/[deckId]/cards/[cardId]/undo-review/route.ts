import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { findOwnedCard } from "@/lib/decks/ownership";

// Annule la dernière révision d'une carte : restaure l'état SM-2 (répétitions,
// intervalle, facilité, échéance) tel qu'il était juste avant, et supprime
// l'entrée d'historique correspondante. Ne remonte que d'un cran (pas de pile
// d'annulations multiples) : si on annule à nouveau, on annule la révision
// précédente, et ainsi de suite.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> },
) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const { deckId, cardId } = await params;

    const card = await findOwnedCard(deckId, cardId, user.id);

    if (!card) {
      return Response.json({ error: "Carte introuvable pour ce deck." }, { status: 404 });
    }

    const lastTwoLogs = await prisma.reviewLog.findMany({
      where: { cardId },
      orderBy: { reviewedAt: "desc" },
      take: 2,
    });

    const [lastLog, previousLog] = lastTwoLogs;

    if (!lastLog) {
      return Response.json({ error: "Aucune révision à annuler pour ce mot." }, { status: 400 });
    }

    // Reconstruit l'état d'avant la dernière révision : soit celui laissé par
    // la révision précédente (recalculé à partir de sa note, comme le ferait
    // scheduleReview), soit l'état initial d'une carte jamais révisée.
    const restoredState = previousLog
      ? {
          repetitions: previousLog.repetitions,
          interval: previousLog.interval,
          easeFactor: previousLog.easeFactor,
          dueAt:
            previousLog.quality < 3
              ? new Date(previousLog.reviewedAt.getTime() + 60 * 1000)
              : new Date(previousLog.reviewedAt.getTime() + previousLog.interval * 24 * 60 * 60 * 1000),
        }
      : {
          repetitions: 0,
          interval: 0,
          easeFactor: 2.5,
          dueAt: card.createdAt,
        };

    const [restoredCard] = await prisma.$transaction([
      prisma.card.update({ where: { id: cardId }, data: restoredState }),
      prisma.reviewLog.delete({ where: { id: lastLog.id } }),
    ]);

    return Response.json({ card: restoredCard });
  } catch (error) {
    console.error("Failed to undo review:", error);
    return Response.json({ error: "Impossible d'annuler la révision." }, { status: 500 });
  }
}
