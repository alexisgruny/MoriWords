// Vraie DB Postgres, mais translateText est mocké : aucun appel réel à Anthropic.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { translateTextMock } = vi.hoisted(() => ({ translateTextMock: vi.fn() }));

vi.mock("@/lib/translation/translate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/translation/translate")>();
  return { ...actual, translateText: translateTextMock };
});

import { prisma } from "@/lib/db/prisma";
import { POST as createDeck } from "@/app/api/decks/route";
import { POST as addCard } from "@/app/api/decks/[deckId]/cards/route";
import { MISSING_TRANSLATION_PLACEHOLDER } from "@/lib/translation/translate";

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const deckIdsToCleanUp: string[] = [];

async function createThrowawayDeck() {
  const response = await createDeck(
    jsonRequest("http://localhost/api/decks", { name: `Auto-translate test deck ${Date.now()}` }),
  );
  const { deck } = (await response.json()) as { deck: { id: string } };
  deckIdsToCleanUp.push(deck.id);
  return { deckId: deck.id, params: Promise.resolve({ deckId: deck.id }) };
}

beforeEach(() => {
  translateTextMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(async () => {
  await prisma.deck.deleteMany({ where: { id: { in: deckIdsToCleanUp } } });
  await prisma.$disconnect();
});

describe("auto-translation when adding a card", () => {
  it("fills the meaning from a translation when none is provided", async () => {
    translateTextMock.mockResolvedValue({ translation: "manger", explanation: "verbe", difficulty: "N5" });
    const { deckId, params } = await createThrowawayDeck();

    const response = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "食べる", reading: "たべる" }),
      { params },
    );
    const body = (await response.json()) as { card: { meaning: string | null } };

    expect(response.status).toBe(201);
    expect(body.card.meaning).toBe("manger");
    expect(translateTextMock).toHaveBeenCalledWith("食べる", "ja", "fr");
  });

  it("does not translate when a meaning is already provided", async () => {
    const { deckId, params } = await createThrowawayDeck();

    const response = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "飲む", meaning: "boire" }),
      { params },
    );
    const body = (await response.json()) as { card: { meaning: string | null } };

    expect(body.card.meaning).toBe("boire");
    expect(translateTextMock).not.toHaveBeenCalled();
  });

  it("does not translate again or overwrite when the card already has a meaning", async () => {
    const { deckId, params } = await createThrowawayDeck();
    await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "見る", meaning: "regarder" }),
      { params },
    );

    const response = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "見る" }),
      { params },
    );
    const body = (await response.json()) as { card: { meaning: string | null } };

    expect(body.card.meaning).toBe("regarder");
    expect(translateTextMock).not.toHaveBeenCalled();
  });

  it("still adds the card without a meaning when the translation fails", async () => {
    translateTextMock.mockRejectedValue(new Error("service down"));
    const { deckId, params } = await createThrowawayDeck();

    const response = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "行く" }),
      { params },
    );
    const body = (await response.json()) as { card: { meaning: string | null } };

    expect(response.status).toBe(201);
    expect(body.card.meaning).toBeNull();
  });

  it("never stores the missing-API-key placeholder as a meaning", async () => {
    translateTextMock.mockResolvedValue({
      translation: MISSING_TRANSLATION_PLACEHOLDER,
      explanation: "clé manquante",
      difficulty: "N5",
    });
    const { deckId, params } = await createThrowawayDeck();

    const response = await addCard(
      jsonRequest(`http://localhost/api/decks/${deckId}/cards`, { lemma: "来る" }),
      { params },
    );
    const body = (await response.json()) as { card: { meaning: string | null } };

    expect(body.card.meaning).toBeNull();
  });
});
