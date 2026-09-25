// Vraie DB Postgres, mais translateText est mocké : aucun appel réel à Anthropic.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { translateTextMock } = vi.hoisted(() => ({ translateTextMock: vi.fn() }));

vi.mock("@/lib/translation/translate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/translation/translate")>();
  return { ...actual, translateText: translateTextMock };
});

import { prisma } from "@/lib/db/prisma";
import { POST as translateMissing } from "@/app/api/decks/[deckId]/cards/translate-missing/route";

const deckIdsToCleanUp: string[] = [];

async function createDeckWithCards(cards: Array<{ lemma: string; meaning: string | null }>) {
  const deck = await prisma.deck.create({ data: { name: `Translate-missing test deck ${Date.now()}` } });
  deckIdsToCleanUp.push(deck.id);

  for (const card of cards) {
    await prisma.card.create({
      data: { deckId: deck.id, lemma: card.lemma, meaning: card.meaning, sourceLanguage: "ja", targetLanguage: "fr" },
    });
  }

  return deck.id;
}

function callRoute(deckId: string, body?: unknown) {
  return translateMissing(
    new Request(`http://localhost/api/decks/${deckId}/cards/translate-missing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
    { params: Promise.resolve({ deckId }) },
  );
}

async function meaningsByLemma(deckId: string) {
  const cards = await prisma.card.findMany({ where: { deckId } });
  return Object.fromEntries(cards.map((card) => [card.lemma, card.meaning]));
}

beforeEach(() => {
  translateTextMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(async () => {
  await prisma.deck.deleteMany({ where: { id: { in: deckIdsToCleanUp } } });
  await prisma.$disconnect();
});

describe("POST /api/decks/[deckId]/cards/translate-missing", () => {
  it("translates only cards without a meaning and never touches existing ones", async () => {
    translateTextMock.mockImplementation(async (text: string) => ({
      translation: `trad-${text}`,
      explanation: "x",
      difficulty: "N5",
    }));
    const deckId = await createDeckWithCards([
      { lemma: "食べる", meaning: null },
      { lemma: "飲む", meaning: "" },
      { lemma: "見る", meaning: "regarder" },
    ]);

    const response = await callRoute(deckId);
    const body = (await response.json()) as { translated: number; failedIds: string[]; remaining: number };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ translated: 2, failedIds: [], remaining: 0 });
    expect(await meaningsByLemma(deckId)).toEqual({
      食べる: "trad-食べる",
      飲む: "trad-飲む",
      見る: "regarder",
    });
    expect(translateTextMock).not.toHaveBeenCalledWith("見る", expect.anything(), expect.anything());
  });

  it("reports failed cards and skips them when they are passed back in excludeIds", async () => {
    translateTextMock.mockImplementation(async (text: string) => {
      if (text === "難しい") {
        throw new Error("service down");
      }
      return { translation: `trad-${text}`, explanation: "x", difficulty: "N5" };
    });
    const deckId = await createDeckWithCards([
      { lemma: "難しい", meaning: null },
      { lemma: "簡単", meaning: null },
    ]);

    const first = (await (await callRoute(deckId)).json()) as {
      translated: number;
      failedIds: string[];
      remaining: number;
    };

    expect(first.translated).toBe(1);
    expect(first.failedIds).toHaveLength(1);
    expect(first.remaining).toBe(0);
    expect((await meaningsByLemma(deckId))["難しい"]).toBeNull();

    translateTextMock.mockClear();
    const second = (await (await callRoute(deckId, { excludeIds: first.failedIds })).json()) as {
      translated: number;
    };

    expect(second.translated).toBe(0);
    expect(translateTextMock).not.toHaveBeenCalled();
  });

  it("works through a large deck in batches, reporting how many remain", async () => {
    translateTextMock.mockImplementation(async (text: string) => ({
      translation: `trad-${text}`,
      explanation: "x",
      difficulty: "N5",
    }));
    const deckId = await createDeckWithCards(
      Array.from({ length: 13 }, (_, index) => ({ lemma: `語${index}`, meaning: null })),
    );

    const first = (await (await callRoute(deckId)).json()) as { translated: number; remaining: number };
    expect(first.translated).toBe(10);
    expect(first.remaining).toBe(3);

    const second = (await (await callRoute(deckId)).json()) as { translated: number; remaining: number };
    expect(second.translated).toBe(3);
    expect(second.remaining).toBe(0);
  });

  it("returns 404 for an unknown deck", async () => {
    const response = await callRoute("does-not-exist");
    expect(response.status).toBe(404);
  });
});
