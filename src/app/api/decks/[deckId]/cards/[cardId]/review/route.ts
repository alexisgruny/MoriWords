import { prisma } from "@/lib/db/prisma";
import { scheduleReview } from "@/lib/srs/scheduler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> },
) {
  try {
    const { deckId, cardId } = await params;
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return Response.json(
        { error: "Le score de révision est requis." },
        { status: 400 },
      );
    }

    const quality = Number((body as Record<string, unknown>).quality);

    if (!Number.isFinite(quality) || quality < 0 || quality > 5) {
      return Response.json(
        { error: "Le score doit être compris entre 0 et 5." },
        { status: 400 },
      );
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card || card.deckId !== deckId) {
      return Response.json(
        { error: "Carte introuvable pour ce deck." },
        { status: 404 },
      );
    }

    const nextState = scheduleReview(
      {
        repetitions: card.repetitions,
        interval: card.interval,
        easeFactor: card.easeFactor,
        dueAt: new Date(card.dueAt),
      },
      quality,
    );

    const [updatedCard] = await prisma.$transaction([
      prisma.card.update({
        where: { id: cardId },
        data: {
          repetitions: nextState.repetitions,
          interval: nextState.interval,
          easeFactor: nextState.easeFactor,
          dueAt: nextState.dueAt,
        },
      }),
      prisma.reviewLog.create({
        data: {
          cardId,
          quality,
          interval: nextState.interval,
          easeFactor: nextState.easeFactor,
          repetitions: nextState.repetitions,
        },
      }),
    ]);

    return Response.json({ card: updatedCard });
  } catch (error) {
    console.error("Failed to record review:", error);
    return Response.json(
      { error: "Impossible de mettre à jour la révision." },
      { status: 500 },
    );
  }
}
