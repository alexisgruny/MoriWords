// Vraie DB Postgres : un compte ne voit ni ne modifie les données d'un autre
// (réponse 404, comme si la ressource n'existait pas).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser } = vi.hoisted(() => ({ testUser: { id: "", email: "" } }));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { GET as listDecks } from "@/app/api/decks/route";
import { DELETE as deleteDeck, GET as getDeck } from "@/app/api/decks/[deckId]/route";
import { POST as reviewCard } from "@/app/api/decks/[deckId]/cards/[cardId]/review/route";
import { GET as getSourceText } from "@/app/api/source-texts/[id]/route";
import { jsonRequest } from "./test-helpers";

let otherUserId = "";
let otherDeckId = "";
let otherCardId = "";
let otherTextId = "";

beforeAll(async () => {
  Object.assign(testUser, await createTestUser("ownership-me"));
  otherUserId = (await createTestUser("ownership-other")).id;

  const deck = await prisma.deck.create({ data: { userId: otherUserId, name: "Deck d'un autre compte" } });
  const card = await prisma.card.create({ data: { deckId: deck.id, lemma: "秘密", meaning: "secret" } });
  const text = await prisma.sourceText.create({ data: { userId: otherUserId, content: "秘密の文章" } });
  otherDeckId = deck.id;
  otherCardId = card.id;
  otherTextId = text.id;
});

afterAll(async () => {
  await deleteTestUser(testUser.id);
  await deleteTestUser(otherUserId);
  await prisma.$disconnect();
});

describe("isolation between accounts", () => {
  it("never lists, returns, reviews or deletes another account's data", async () => {
    const list = (await (await listDecks(new Request("http://localhost/api/decks"))).json()) as {
      decks: Array<{ id: string }>;
    };
    expect(list.decks.map((deck) => deck.id)).not.toContain(otherDeckId);

    const deckParams = { params: Promise.resolve({ deckId: otherDeckId }) };
    expect((await getDeck(new Request("http://localhost"), deckParams)).status).toBe(404);
    expect((await deleteDeck(new Request("http://localhost", { method: "DELETE" }), deckParams)).status).toBe(404);

    const review = await reviewCard(jsonRequest("http://localhost", { quality: 5 }), {
      params: Promise.resolve({ deckId: otherDeckId, cardId: otherCardId }),
    });
    expect(review.status).toBe(404);

    const text = await getSourceText(new Request("http://localhost"), { params: Promise.resolve({ id: otherTextId }) });
    expect(text.status).toBe(404);

    // Rien n'a bougé côté autre compte.
    expect(await prisma.deck.count({ where: { id: otherDeckId } })).toBe(1);
    expect(await prisma.reviewLog.count({ where: { cardId: otherCardId } })).toBe(0);
  });
});
