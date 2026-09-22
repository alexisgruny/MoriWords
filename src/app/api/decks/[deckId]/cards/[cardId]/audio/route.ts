import { prisma } from "@/lib/db/prisma";
import { TtsServiceError, synthesizeSpeech } from "@/lib/tts/synthesize";

// Génère (ou réutilise) l'audio de la lecture d'une carte et l'associe à la carte.
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

    const speech = await synthesizeSpeech(card.reading || card.surface || card.lemma, card.sourceLanguage);

    if (!speech) {
      return Response.json(
        { error: "La génération audio n'est pas disponible pour le moment." },
        { status: 503 },
      );
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: { audioCacheId: speech.audioCacheId },
    });

    return Response.json({ card: updatedCard, audioUrl: `/api/audio/${speech.audioCacheId}` });
  } catch (error) {
    if (error instanceof TtsServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to synthesize card audio:", error);
    return Response.json(
      { error: "Impossible de générer l'audio pour cette carte." },
      { status: 500 },
    );
  }
}
