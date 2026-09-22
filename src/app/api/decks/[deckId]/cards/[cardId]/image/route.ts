import { prisma } from "@/lib/db/prisma";
import { toEnglishImageQuery } from "@/lib/images/gloss";
import { ImageServiceError, searchCardImage } from "@/lib/images/search";

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

    const englishQuery = await toEnglishImageQuery(
      card.meaning || card.lemma,
      card.meaning ? card.targetLanguage : card.sourceLanguage,
    );
    const image = await searchCardImage(englishQuery);

    if (!image) {
      return Response.json(
        { error: "Aucune image disponible pour le moment." },
        { status: 503 },
      );
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: { imageUrl: image.imageUrl, imageAttribution: image.attribution },
    });

    return Response.json({ card: updatedCard });
  } catch (error) {
    if (error instanceof ImageServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to fetch card image:", error);
    return Response.json(
      { error: "Impossible de récupérer une image pour cette carte." },
      { status: 500 },
    );
  }
}
