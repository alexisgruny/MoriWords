import { prisma } from "@/lib/db/prisma";
import { autoTranslateLemma } from "@/lib/decks/auto-translate";

// Petits lots : chaque appel reste court (limite de durée des fonctions
// serverless) ; le client enchaîne les appels jusqu'à ce qu'il n'en reste plus.
const BATCH_SIZE = 10;
const CONCURRENCY = 5;

// Donne un sens (traduction automatique) aux cartes du deck qui n'en ont pas.
// Ne touche jamais une carte qui a déjà un sens. Le client renvoie dans
// excludeIds les cartes déjà tentées sans succès, pour ne pas boucler dessus.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { deckId } = await params;
    const body: unknown = await request.json().catch(() => ({}));
    const rawExcluded =
      typeof body === "object" && body !== null && "excludeIds" in body ? body.excludeIds : [];
    const excludeIds = Array.isArray(rawExcluded)
      ? rawExcluded.filter((id): id is string => typeof id === "string")
      : [];

    const deck = await prisma.deck.findUnique({ where: { id: deckId } });

    if (!deck) {
      return Response.json({ error: "Deck introuvable." }, { status: 404 });
    }

    const withoutMeaning = { OR: [{ meaning: null }, { meaning: "" }] };

    const batch = await prisma.card.findMany({
      where: { deckId, ...withoutMeaning, id: { notIn: excludeIds } },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: { id: true, lemma: true },
    });

    let translated = 0;
    const failedIds: string[] = [];

    for (let index = 0; index < batch.length; index += CONCURRENCY) {
      await Promise.all(
        batch.slice(index, index + CONCURRENCY).map(async (card) => {
          const meaning = await autoTranslateLemma(card.lemma);

          if (!meaning) {
            failedIds.push(card.id);
            return;
          }

          // Ne remplit que si le sens est toujours vide : n'écrase jamais une
          // modification faite entre-temps.
          const result = await prisma.card.updateMany({
            where: { id: card.id, ...withoutMeaning },
            data: { meaning },
          });

          translated += result.count;
        }),
      );
    }

    const remaining = await prisma.card.count({
      where: { deckId, ...withoutMeaning, id: { notIn: [...excludeIds, ...failedIds] } },
    });

    return Response.json({ translated, failedIds, remaining });
  } catch (error) {
    console.error("Failed to translate cards without meaning:", error);
    return Response.json(
      { error: "Impossible de traduire les mots sans sens." },
      { status: 500 },
    );
  }
}
