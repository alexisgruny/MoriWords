// Runs against the real local Postgres DB (same DATABASE_URL as `npm run dev`),
// exercising the actual route handlers end to end instead of mocked Prisma calls.
// This mirrors the manual flow already validated by hand during development.
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { POST as createSourceText } from "@/app/api/source-texts/route";
import { POST as createDeck } from "@/app/api/decks/route";
import { GET as getDeckCards, POST as addCard } from "@/app/api/decks/[deckId]/cards/route";
import { DELETE as deleteCard } from "@/app/api/decks/[deckId]/cards/[cardId]/route";
import { POST as reviewCard } from "@/app/api/decks/[deckId]/cards/[cardId]/review/route";
import { GET as getDeckStats } from "@/app/api/decks/[deckId]/stats/route";

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const deckIdsToCleanUp: string[] = [];
const sourceTextIdsToCleanUp: string[] = [];

afterAll(async () => {
  await prisma.deck.deleteMany({ where: { id: { in: deckIdsToCleanUp } } });
  await prisma.sourceText.deleteMany({ where: { id: { in: sourceTextIdsToCleanUp } } });
  await prisma.$disconnect();
});

describe("card lifecycle (integration, real DB)", () => {
  it("dedups a word seen in two texts into one card with two occurrences, then reviews and deletes it", async () => {
    const src1Response = await createSourceText(
      jsonRequest("http://localhost/api/source-texts", {
        content: "美味しい料理を食べました。",
        origin: "integration-test",
      }),
    );
    const src1 = (await src1Response.json()) as { sourceText: { id: string } };
    sourceTextIdsToCleanUp.push(src1.sourceText.id);

    const src2Response = await createSourceText(
      jsonRequest("http://localhost/api/source-texts", {
        content: "この店の料理はとても美味しいです。",
        origin: "integration-test",
      }),
    );
    const src2 = (await src2Response.json()) as { sourceText: { id: string } };
    sourceTextIdsToCleanUp.push(src2.sourceText.id);

    const deckResponse = await createDeck(
      jsonRequest("http://localhost/api/decks", { name: `Integration test deck ${Date.now()}` }),
    );
    const deck = (await deckResponse.json()) as { deck: { id: string } };
    deckIdsToCleanUp.push(deck.deck.id);
    const deckId = deck.deck.id;

    const params = Promise.resolve({ deckId });

    const add1Response = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, {
        lemma: "美味しい",
        surface: "美味しい",
        reading: "おいしい",
        meaning: "délicieux",
        sourceTextId: src1.sourceText.id,
        position: 0,
      }),
      { params },
    );
    const add1 = (await add1Response.json()) as {
      card: { id: string };
      alreadyExisted: boolean;
      occurrenceCount: number;
    };
    expect(add1Response.status).toBe(201);
    expect(add1.alreadyExisted).toBe(false);
    expect(add1.occurrenceCount).toBe(1);
    const cardId = add1.card.id;

    const add2Response = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, {
        lemma: "美味しい",
        surface: "美味しい",
        reading: "おいしい",
        meaning: "délicieux",
        sourceTextId: src2.sourceText.id,
        position: 3,
      }),
      { params },
    );
    const add2 = (await add2Response.json()) as { card: { id: string }; alreadyExisted: boolean; occurrenceCount: number };
    expect(add2.alreadyExisted).toBe(true);
    expect(add2.card.id).toBe(cardId);
    expect(add2.occurrenceCount).toBe(2);

    const cardsListResponse = await getDeckCards(new Request(`http://localhost/api/decks/${deckId}/cards`), {
      params,
    });
    const cardsList = (await cardsListResponse.json()) as {
      cards: Array<{ id: string; occurrences: unknown[] }>;
    };
    expect(cardsList.cards).toHaveLength(1);
    expect(cardsList.cards[0].occurrences).toHaveLength(2);

    const reviewParams = Promise.resolve({ deckId, cardId });
    const reviewResponse = await reviewCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards/${cardId}/review`, { quality: 4 }),
      { params: reviewParams },
    );
    expect(reviewResponse.status).toBe(200);
    const reviewed = (await reviewResponse.json()) as { card: { repetitions: number } };
    expect(reviewed.card.repetitions).toBe(1);

    const statsResponse = await getDeckStats(new Request(`http://localhost/api/decks/${deckId}/stats`), {
      params,
    });
    const stats = (await statsResponse.json()) as {
      totalCards: number;
      totalReviews: number;
      successRate: number | null;
    };
    expect(stats.totalCards).toBe(1);
    expect(stats.totalReviews).toBe(1);
    expect(stats.successRate).toBe(1);

    const deleteResponse = await deleteCard(new Request(`http://localhost/api/decks/${deckId}/cards/${cardId}`, {
      method: "DELETE",
    }), { params: reviewParams });
    expect(deleteResponse.status).toBe(200);

    const cardsAfterDeleteResponse = await getDeckCards(
      new Request(`http://localhost/api/decks/${deckId}/cards`),
      { params },
    );
    const cardsAfterDelete = (await cardsAfterDeleteResponse.json()) as { cards: unknown[] };
    expect(cardsAfterDelete.cards).toHaveLength(0);
  });

  it("keeps an existing translated meaning when the same word is re-added without one (bulk add)", async () => {
    const deckResponse = await createDeck(
      jsonRequest("http://localhost/api/decks", { name: `Integration test deck ${Date.now()}` }),
    );
    const deck = (await deckResponse.json()) as { deck: { id: string } };
    deckIdsToCleanUp.push(deck.deck.id);
    const deckId = deck.deck.id;
    const params = Promise.resolve({ deckId });

    // Premier ajout : le mot a déjà été traduit (ex. via le clic "Traduire").
    const translatedResponse = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, {
        lemma: "食べる",
        surface: "食べる",
        reading: "たべる",
        meaning: "manger",
      }),
      { params },
    );
    const translated = (await translatedResponse.json()) as { card: { id: string; meaning: string | null } };
    expect(translated.card.meaning).toBe("manger");

    // Deuxième ajout du même mot sans traduction (le payload envoyé par
    // l'ajout en masse, qui ne traduit rien) : ne doit pas effacer le sens
    // déjà enregistré.
    const bulkResponse = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, {
        lemma: "食べる",
        surface: "食べる",
        reading: "たべる",
      }),
      { params },
    );
    const bulk = (await bulkResponse.json()) as {
      card: { id: string; meaning: string | null };
      alreadyExisted: boolean;
    };
    expect(bulk.alreadyExisted).toBe(true);
    expect(bulk.card.id).toBe(translated.card.id);
    expect(bulk.card.meaning).toBe("manger");
  });
});
