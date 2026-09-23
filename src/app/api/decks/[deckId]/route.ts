import { prisma } from "@/lib/db/prisma";

// Renvoie un seul deck avec ses cartes, pour la page de détail d'un deck.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { deckId } = await params;

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: { cards: { orderBy: { createdAt: "desc" } } },
    });

    if (!deck) {
      return Response.json({ error: "Deck introuvable." }, { status: 404 });
    }

    return Response.json({ deck });
  } catch (error) {
    console.error("Failed to fetch deck:", error);
    return Response.json(
      { error: "Impossible de récupérer le deck." },
      { status: 500 },
    );
  }
}

// Supprime définitivement un deck ; ses cartes sont supprimées en cascade
// (voir onDelete: Cascade sur Card.deck dans le schéma Prisma).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { deckId } = await params;

    const deck = await prisma.deck.findUnique({ where: { id: deckId } });

    if (!deck) {
      return Response.json({ error: "Deck introuvable." }, { status: 404 });
    }

    await prisma.deck.delete({ where: { id: deckId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete deck:", error);
    return Response.json(
      { error: "Impossible de supprimer le deck." },
      { status: 500 },
    );
  }
}
