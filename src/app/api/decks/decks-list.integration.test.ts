// Vraie DB Postgres : la liste des decks ne renvoie que les champs utiles des
// cartes, et jamais les decks d'un autre compte.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser } = vi.hoisted(() => ({ testUser: { id: "", email: "" } }));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));

import { GET as listDecks } from "@/app/api/decks/route";
import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";

let otherUserId = "";

beforeAll(async () => {
  Object.assign(testUser, await createTestUser("decks-list"));
  otherUserId = (await createTestUser("decks-list-other")).id;
  const deck = await prisma.deck.create({ data: { userId: testUser.id, name: "Deck jetable" } });
  await prisma.card.create({ data: { deckId: deck.id, lemma: "猫", reading: "ねこ", meaning: "chat", surface: "猫", repetitions: 3 } });
  await prisma.deck.create({ data: { userId: otherUserId, name: "Deck d'un autre compte" } });
});

afterAll(async () => {
  await deleteTestUser(testUser.id);
  await deleteTestUser(otherUserId);
  await prisma.$disconnect();
});

describe("GET /api/decks", () => {
  it("returns only the account's decks, with the card fields the pages use", async () => {
    const response = await listDecks(new Request("http://localhost/api/decks"));
    const { decks } = (await response.json()) as { decks: Array<{ name: string; cards: Array<Record<string, unknown>> }> };

    expect(decks.map((deck) => deck.name)).toEqual(["Deck jetable"]);
    expect(Object.keys(decks[0].cards[0]).sort()).toEqual(["dueAt", "id", "lemma", "meaning", "reading"]);
    expect(decks[0].cards[0]).toMatchObject({ lemma: "猫", reading: "ねこ", meaning: "chat" });
  });
});
