// Vraie DB Postgres, mais translateText et generateJsonFromClaude sont mockés :
// aucun appel réel à Anthropic.
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
import { POST as addCard } from "@/app/api/decks/[deckId]/cards/route";
import { POST as generateCardExamples } from "@/app/api/decks/[deckId]/cards/[cardId]/examples/route";

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const sampleExamples = Array.from({ length: 5 }, (_, index) => ({
  japanese: `例文${index}`,
  reading: `れいぶん${index}`,
  translation: `Exemple ${index}`,
}));

const deckIdsToCleanUp: string[] = [];

async function createThrowawayDeck() {
  const response = await createDeck(
    jsonRequest("http://localhost/api/decks", { name: `Examples test deck ${Date.now()}` }),
  );
  const { deck } = (await response.json()) as { deck: { id: string } };
  deckIdsToCleanUp.push(deck.id);
  return deck.id;
}

beforeEach(() => {
  translateTextMock.mockReset();
  translateTextMock.mockResolvedValue({ translation: "manger", explanation: "verbe", difficulty: "N5" });
  generateJsonFromClaudeMock.mockReset();
  generateJsonFromClaudeMock.mockResolvedValue({ examples: sampleExamples });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(async () => {
  await prisma.deck.deleteMany({ where: { id: { in: deckIdsToCleanUp } } });
  await prisma.$disconnect();
});

describe("card examples on add", () => {
  it("generates 5 examples when a new card is added", async () => {
    const deckId = await createThrowawayDeck();

    const response = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "食べる", reading: "たべる" }),
      { params: Promise.resolve({ deckId }) },
    );
    const body = (await response.json()) as { card: { id: string; examples: unknown[] } };

    expect(response.status).toBe(201);
    expect(body.card.examples).toHaveLength(5);

    const stored = await prisma.cardExample.findMany({ where: { cardId: body.card.id } });
    expect(stored).toHaveLength(5);
    expect(stored[0].translation).toBe("Exemple 0");
  });

  it("does not regenerate examples when the same word is added again", async () => {
    const deckId = await createThrowawayDeck();
    const params = Promise.resolve({ deckId });

    const first = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "飲む", reading: "のむ" }),
      { params },
    );
    const firstBody = (await first.json()) as { card: { id: string } };

    generateJsonFromClaudeMock.mockClear();

    const second = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "飲む", reading: "のむ" }),
      { params },
    );
    const secondBody = (await second.json()) as { card: { id: string; examples: unknown[] } };

    expect(secondBody.card.id).toBe(firstBody.card.id);
    expect(secondBody.card.examples).toHaveLength(5);
    expect(generateJsonFromClaudeMock).not.toHaveBeenCalled();
  });

  it("generates examples on demand for a card that has none", async () => {
    const deckId = await createThrowawayDeck();
    const card = await prisma.card.create({
      data: { deckId, lemma: "見る", meaning: "regarder", sourceLanguage: "ja", targetLanguage: "fr" },
    });

    const response = await generateCardExamples(
      new Request(`http://localhost/api/decks/${deckId}/cards/${card.id}/examples`, { method: "POST" }),
      { params: Promise.resolve({ deckId, cardId: card.id }) },
    );
    const body = (await response.json()) as { examples: unknown[] };

    expect(response.status).toBe(200);
    expect(body.examples).toHaveLength(5);
  });
});
