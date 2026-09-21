import { prisma } from "@/lib/db/prisma";
import { normalizeCardPayload } from "@/lib/decks/card-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { deckId } = await params;
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return Response.json(
        { error: "Le payload de carte est requis." },
        { status: 400 },
      );
    }

    const candidate = body as Record<string, unknown>;
    const lemma = typeof candidate.lemma === "string" ? candidate.lemma.trim() : "";

    if (!lemma) {
      return Response.json(
        { error: "Le lemme est requis." },
        { status: 400 },
      );
    }

    const normalized = normalizeCardPayload({
      lemma,
      surface: typeof candidate.surface === "string" ? candidate.surface : null,
      reading: typeof candidate.reading === "string" ? candidate.reading : null,
      meaning: typeof candidate.meaning === "string" ? candidate.meaning : null,
    });

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      return Response.json(
        { error: "Deck introuvable." },
        { status: 404 },
      );
    }

    const card = await prisma.card.upsert({
      where: {
        deckId_lemma_sourceLanguage_targetLanguage: {
          deckId,
          lemma: normalized.lemma,
          sourceLanguage: "ja",
          targetLanguage: "fr",
        },
      },
      update: {
        surface: normalized.surface,
        reading: normalized.reading,
        meaning: normalized.meaning,
      },
      create: {
        deckId,
        lemma: normalized.lemma,
        surface: normalized.surface,
        reading: normalized.reading,
        meaning: normalized.meaning,
        sourceLanguage: "ja",
        targetLanguage: "fr",
      },
    });

    return Response.json({ card }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Impossible d’ajouter la carte au deck." },
      { status: 500 },
    );
  }
}
