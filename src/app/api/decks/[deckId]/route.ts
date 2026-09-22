import { prisma } from "@/lib/db/prisma";

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
