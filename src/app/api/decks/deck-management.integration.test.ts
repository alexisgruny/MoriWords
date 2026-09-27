// Vraie DB Postgres, mais translateText et generateJsonFromClaude sont mockés :
// aucun appel réel à Anthropic. Couvre le renommage de deck, l'édition et le
// déplacement de carte, l'annulation de révision et la liste des cartes dues
// tous decks confondus.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { translateTextMock, generateJsonFromClaudeMock } = vi.hoisted(() => ({
  translateTextMock: vi.fn(),
  generateJsonFromClaudeMock: vi.fn(),
}));

vi.mock("@/lib/translation/translate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/translation/translate")>();
  return { ...actual, translateText: translateTextMock };
});

vi.mock("@/lib/feeds/claude-json-generator", () => ({
  generateJsonFromClaude: generateJsonFromClaudeMock,
}));

import { prisma } from "@/lib/db/prisma";
import { POST as createDeck } from "@/app/api/decks/route";
import { PATCH as patchDeckRename } from "@/app/api/decks/[deckId]/route";
import { POST as addCard } from "@/app/api/decks/[deckId]/cards/route";
import { PATCH as patchCard } from "@/app/api/decks/[deckId]/cards/[cardId]/route";
import { POST as reviewCard } from "@/app/api/decks/[deckId]/cards/[cardId]/review/route";
import { POST as undoReview } from "@/app/api/decks/[deckId]/cards/[cardId]/undo-review/route";
import { GET as getDueCards } from "@/app/api/decks/due/route";
import { jsonRequest } from "./test-helpers";

const deckIdsToCleanUp: string[] = [];

async function createThrowawayDeck(name: string) {
  const response = await createDeck(jsonRequest("http://localhost/api/decks", { name }));
  const { deck } = (await response.json()) as { deck: { id: string } };
  deckIdsToCleanUp.push(deck.id);
  return deck.id;
}

beforeEach(() => {
  translateTextMock.mockReset();
  translateTextMock.mockResolvedValue({ translation: "manger", explanation: "verbe", difficulty: "N5" });
  generateJsonFromClaudeMock.mockReset();
  generateJsonFromClaudeMock.mockResolvedValue({ examples: [] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(async () => {
  await prisma.deck.deleteMany({ where: { id: { in: deckIdsToCleanUp } } });
  await prisma.$disconnect();
});

describe("PATCH /api/decks/[deckId] (rename)", () => {
  it("renames a deck", async () => {
    const deckId = await createThrowawayDeck(`Rename test deck ${Date.now()}`);

    const response = await patchDeckRename(
      jsonRequest(`http://localhost/api/decks/${deckId}`, { name: "Nouveau nom" }, "PATCH"),
      { params: Promise.resolve({ deckId }) },
    );
    const body = (await response.json()) as { deck: { name: string } };

    expect(response.status).toBe(200);
    expect(body.deck.name).toBe("Nouveau nom");
  });

  it("rejects an empty name", async () => {
    const deckId = await createThrowawayDeck(`Rename reject test deck ${Date.now()}`);

    const response = await patchDeckRename(
      jsonRequest(`http://localhost/api/decks/${deckId}`, { name: "   " }, "PATCH"),
      { params: Promise.resolve({ deckId }) },
    );

    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/decks/[deckId]/cards/[cardId] (edit and move)", () => {
  it("updates the reading and meaning of a card", async () => {
    const deckId = await createThrowawayDeck(`Edit card test deck ${Date.now()}`);
    const addResponse = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "食べる", reading: "たべる" }),
      { params: Promise.resolve({ deckId }) },
    );
    const { card } = (await addResponse.json()) as { card: { id: string } };

    const response = await patchCard(
      jsonRequest(
        `http://localhost/api/decks/${deckId}/cards/${card.id}`,
        { reading: "タベル", meaning: "manger (corrigé)" },
        "PATCH",
      ),
      { params: Promise.resolve({ deckId, cardId: card.id }) },
    );
    const body = (await response.json()) as { card: { reading: string; meaning: string } };

    expect(response.status).toBe(200);
    expect(body.card.reading).toBe("タベル");
    expect(body.card.meaning).toBe("manger (corrigé)");
  });

  it("moves a card to another deck", async () => {
    const sourceDeckId = await createThrowawayDeck(`Move source deck ${Date.now()}`);
    const targetDeckId = await createThrowawayDeck(`Move target deck ${Date.now()}`);
    const addResponse = await addCard(
      jsonRequest(`http://localhost/api/decks/${sourceDeckId}/cards`, { lemma: "飲む", reading: "のむ" }),
      { params: Promise.resolve({ deckId: sourceDeckId }) },
    );
    const { card } = (await addResponse.json()) as { card: { id: string } };

    const response = await patchCard(
      jsonRequest(
        `http://localhost/api/decks/${sourceDeckId}/cards/${card.id}`,
        { deckId: targetDeckId },
        "PATCH",
      ),
      { params: Promise.resolve({ deckId: sourceDeckId, cardId: card.id }) },
    );
    const body = (await response.json()) as { card: { deckId: string } };

    expect(response.status).toBe(200);
    expect(body.card.deckId).toBe(targetDeckId);
  });

  it("refuses to move a card onto a duplicate lemma in the target deck", async () => {
    const sourceDeckId = await createThrowawayDeck(`Move conflict source deck ${Date.now()}`);
    const targetDeckId = await createThrowawayDeck(`Move conflict target deck ${Date.now()}`);

    const addToSource = await addCard(
      jsonRequest(`http://localhost/api/decks/${sourceDeckId}/cards`, { lemma: "見る", reading: "みる" }),
      { params: Promise.resolve({ deckId: sourceDeckId }) },
    );
    const { card } = (await addToSource.json()) as { card: { id: string } };

    await addCard(
      jsonRequest(`http://localhost/api/decks/${targetDeckId}/cards`, { lemma: "見る", reading: "みる" }),
      { params: Promise.resolve({ deckId: targetDeckId }) },
    );

    const response = await patchCard(
      jsonRequest(`http://localhost/api/decks/${sourceDeckId}/cards/${card.id}`, { deckId: targetDeckId }, "PATCH"),
      { params: Promise.resolve({ deckId: sourceDeckId, cardId: card.id }) },
    );

    expect(response.status).toBe(409);

    const untouched = await prisma.card.findUnique({ where: { id: card.id } });
    expect(untouched?.deckId).toBe(sourceDeckId);
  });
});

describe("POST /api/decks/[deckId]/cards/[cardId]/undo-review", () => {
  it("restores the pristine state when undoing the very first review", async () => {
    const deckId = await createThrowawayDeck(`Undo first review test deck ${Date.now()}`);
    const addResponse = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "話す", reading: "はなす" }),
      { params: Promise.resolve({ deckId }) },
    );
    const { card } = (await addResponse.json()) as { card: { id: string } };
    const params = Promise.resolve({ deckId, cardId: card.id });

    await reviewCard(jsonRequest(`http://localhost/api/decks/${deckId}/cards/${card.id}/review`, { quality: 5 }), {
      params,
    });

    const response = await undoReview(
      new Request(`http://localhost/api/decks/${deckId}/cards/${card.id}/undo-review`, { method: "POST" }),
      { params },
    );
    const body = (await response.json()) as {
      card: { repetitions: number; interval: number; easeFactor: number };
    };

    expect(response.status).toBe(200);
    expect(body.card.repetitions).toBe(0);
    expect(body.card.interval).toBe(0);
    expect(body.card.easeFactor).toBe(2.5);

    const remainingLogs = await prisma.reviewLog.count({ where: { cardId: card.id } });
    expect(remainingLogs).toBe(0);
  });

  it("restores the state left by the previous review, not a pristine state", async () => {
    const deckId = await createThrowawayDeck(`Undo second review test deck ${Date.now()}`);
    const addResponse = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "書く", reading: "かく" }),
      { params: Promise.resolve({ deckId }) },
    );
    const { card } = (await addResponse.json()) as { card: { id: string } };
    const params = Promise.resolve({ deckId, cardId: card.id });

    const firstReview = await reviewCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards/${card.id}/review`, { quality: 5 }),
      { params },
    );
    const firstBody = (await firstReview.json()) as { card: { repetitions: number; interval: number } };

    await reviewCard(jsonRequest(`http://localhost/api/decks/${deckId}/cards/${card.id}/review`, { quality: 5 }), {
      params,
    });

    const response = await undoReview(
      new Request(`http://localhost/api/decks/${deckId}/cards/${card.id}/undo-review`, { method: "POST" }),
      { params },
    );
    const body = (await response.json()) as { card: { repetitions: number; interval: number } };

    expect(response.status).toBe(200);
    expect(body.card.repetitions).toBe(firstBody.card.repetitions);
    expect(body.card.interval).toBe(firstBody.card.interval);

    const remainingLogs = await prisma.reviewLog.count({ where: { cardId: card.id } });
    expect(remainingLogs).toBe(1);
  });

  it("returns 400 when there is nothing to undo", async () => {
    const deckId = await createThrowawayDeck(`Undo nothing test deck ${Date.now()}`);
    const addResponse = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "聞く", reading: "きく" }),
      { params: Promise.resolve({ deckId }) },
    );
    const { card } = (await addResponse.json()) as { card: { id: string } };

    const response = await undoReview(
      new Request(`http://localhost/api/decks/${deckId}/cards/${card.id}/undo-review`, { method: "POST" }),
      { params: Promise.resolve({ deckId, cardId: card.id }) },
    );

    expect(response.status).toBe(400);
  });
});

describe("GET /api/decks/due", () => {
  it("returns due cards across decks, each tagged with its deck", async () => {
    const deckAId = await createThrowawayDeck(`Due list deck A ${Date.now()}`);
    const deckBId = await createThrowawayDeck(`Due list deck B ${Date.now()}`);

    const addA = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckAId}/cards`, { lemma: "泳ぐ", reading: "およぐ" }),
      { params: Promise.resolve({ deckId: deckAId }) },
    );
    const { card: cardA } = (await addA.json()) as { card: { id: string } };
    const addB = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckBId}/cards`, { lemma: "走る", reading: "はしる" }),
      { params: Promise.resolve({ deckId: deckBId }) },
    );
    const { card: cardB } = (await addB.json()) as { card: { id: string } };

    const response = await getDueCards();
    const body = (await response.json()) as {
      cards: Array<{ id: string; deckId: string; deck: { name: string } }>;
    };

    expect(response.status).toBe(200);
    const ids = body.cards.map((card) => card.id);
    expect(ids).toContain(cardA.id);
    expect(ids).toContain(cardB.id);

    const returnedA = body.cards.find((card) => card.id === cardA.id);
    expect(returnedA?.deckId).toBe(deckAId);
    expect(returnedA?.deck.name).toContain("Due list deck A");
  });
});
