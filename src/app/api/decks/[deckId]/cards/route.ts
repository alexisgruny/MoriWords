import { prisma } from "@/lib/db/prisma";
import { normalizeCardPayload } from "@/lib/decks/card-utils";
import { MISSING_TRANSLATION_PLACEHOLDER, translateText } from "@/lib/translation/translate";

// Traduit un mot pour lui donner un sens dès son ajout au deck (traduction
// en cache si elle existe déjà, sinon appel à Claude). Ne bloque jamais
// l'ajout : en cas d'échec ou de clé API absente, la carte est simplement
// ajoutée sans sens.
async function autoTranslateLemma(lemma: string): Promise<string | null> {
  try {
    const result = await translateText(lemma, "ja", "fr");
    const translation = result.translation.trim();

    if (!translation || translation === MISSING_TRANSLATION_PLACEHOLDER) {
      return null;
    }

    return translation;
  } catch (error) {
    console.error("Auto-translation on card add failed:", error);
    return null;
  }
}

// Ajoute un mot au deck sous forme de carte. Si une carte existe déjà pour ce
// mot dans ce deck, on ne crée pas de doublon : on ajoute simplement une
// nouvelle occurrence (le texte où le mot a été rencontré) à la carte existante.
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

    // Vérifie si la carte existe déjà, pour savoir si on vient d'en créer une
    // nouvelle ou si on ajoute juste une occurrence à une carte existante.
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

    // Sens à enregistrer : celui fourni, sinon celui déjà présent sur la carte,
    // sinon une traduction automatique (jamais d'écrasement d'un sens existant).
    const meaning =
      normalized.meaning ?? existingCard?.meaning ?? (await autoTranslateLemma(normalized.lemma));

    // Crée la carte si elle n'existe pas encore, sinon met à jour ses champs.
    const card = await prisma.card.upsert({
      where: {
        deckId_lemma_sourceLanguage_targetLanguage: {
          deckId,
          lemma: normalized.lemma,
          sourceLanguage: "ja",
          targetLanguage: "fr",
        },
      },
      // N'écrase jamais un champ déjà renseigné par null : un ajout sans
      // traduction (ex. ajout en masse) ne doit pas effacer le sens qu'une
      // traduction précédente avait enregistré pour ce mot dans ce deck.
      update: {
        surface: normalized.surface ?? existingCard?.surface ?? null,
        reading: normalized.reading ?? existingCard?.reading ?? null,
        meaning,
      },
      create: {
        deckId,
        lemma: normalized.lemma,
        surface: normalized.surface,
        reading: normalized.reading,
        meaning,
        sourceLanguage: "ja",
        targetLanguage: "fr",
      },
    });

    // Enregistre le texte source comme occurrence de ce mot (sans doublon
    // si ce texte a déjà été enregistré pour cette carte).
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

// Renvoie toutes les cartes d'un deck, avec les textes où chaque mot est
// apparu (utilisé pour la gestion des cartes et le mode d'entraînement "Contexte").
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
