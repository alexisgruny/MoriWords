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

    const sourceTextId = typeof candidate.sourceTextId === "string" ? candidate.sourceTextId : null;
    const position = typeof candidate.position === "number" && Number.isInteger(candidate.position)
      ? candidate.position
      : null;

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

    const existingCard = await prisma.card.findUnique({
      where: {
        deckId_lemma_sourceLanguage_targetLanguage: {
          deckId,
          lemma: normalized.lemma,
          sourceLanguage: "ja",
          targetLanguage: "fr",
        },
      },
    });

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

    if (sourceTextId) {
      await prisma.wordOccurrence.upsert({
        where: {
          cardId_sourceTextId: {
            cardId: card.id,
            sourceTextId,
          },
        },
        update: {},
        create: {
          cardId: card.id,
          sourceTextId,
          position,
        },
      });
    }

    const occurrenceCount = await prisma.wordOccurrence.count({
      where: { cardId: card.id },
    });

    return Response.json(
      { card, alreadyExisted: existingCard !== null, occurrenceCount },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to add card to deck:", error);
    return Response.json(
      { error: "Impossible d’ajouter la carte au deck." },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { deckId } = await params;

    const cards = await prisma.card.findMany({
      where: { deckId },
      orderBy: { createdAt: "desc" },
      include: {
        occurrences: {
          include: { sourceText: { select: { id: true, title: true, content: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return Response.json({ cards });
  } catch (error) {
    console.error("Failed to fetch deck cards:", error);
    return Response.json(
      { error: "Impossible de récupérer les cartes du deck." },
      { status: 500 },
    );
  }
}
