import { prisma } from "@/lib/db/prisma";
import { ExampleServiceError, generateExamples, saveExamples } from "@/lib/decks/card-examples";

export const maxDuration = 60;

// Génère les 5 phrases d'exemple d'une carte qui n'en a pas encore (cartes
// ajoutées avant cette fonctionnalité, ou génération échouée à l'ajout).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> },
) {
  try {
    const { deckId, cardId } = await params;

    const card = await prisma.card.findUnique({ where: { id: cardId } });

    if (!card || card.deckId !== deckId) {
      return Response.json({ error: "Carte introuvable pour ce deck." }, { status: 404 });
    }

    if ((await prisma.cardExample.count({ where: { cardId } })) === 0) {
      await saveExamples(cardId, await generateExamples(card.lemma));
    }

    const examples = await prisma.cardExample.findMany({
      where: { cardId },
      orderBy: { position: "asc" },
    });

    return Response.json({ examples });
  } catch (error) {
    if (error instanceof ExampleServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to generate card examples:", error);
    return Response.json({ error: "Impossible de générer les exemples de cette carte." }, { status: 500 });
  }
}
