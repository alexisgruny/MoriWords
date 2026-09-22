import { prisma } from "@/lib/db/prisma";

// Supprime définitivement une carte (et ses occurrences/révisions liées) d'un deck.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> },
) {
  try {
    const { deckId, cardId } = await params;

    const card = await prisma.card.findUnique({ where: { id: cardId } });

    if (!card || card.deckId !== deckId) {
      return Response.json(
        { error: "Carte introuvable pour ce deck." },
        { status: 404 },
      );
    }

    await prisma.card.delete({ where: { id: cardId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete card:", error);
    return Response.json(
      { error: "Impossible de supprimer la carte." },
      { status: 500 },
    );
  }
}
