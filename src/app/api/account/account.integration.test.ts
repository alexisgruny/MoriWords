// Vraie DB Postgres : export des données du compte et suppression en cascade.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser } = vi.hoisted(() => ({ testUser: { id: "", email: "" } }));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { DELETE as deleteAccount, GET as exportAccount } from "@/app/api/account/route";

let otherUserId = "";
let myDeckId = "";

beforeAll(async () => {
  Object.assign(testUser, await createTestUser("account-me"));
  otherUserId = (await createTestUser("account-other")).id;

  const deck = await prisma.deck.create({ data: { userId: testUser.id, name: "Mon deck jetable" } });
  await prisma.card.create({ data: { deckId: deck.id, lemma: "猫", meaning: "chat" } });
  await prisma.sourceText.create({ data: { userId: testUser.id, content: "猫が好きです。" } });
  await prisma.deck.create({ data: { userId: otherUserId, name: "Deck d'un autre compte" } });
  myDeckId = deck.id;
});

afterAll(async () => {
  await deleteTestUser(testUser.id);
  await deleteTestUser(otherUserId);
  await prisma.$disconnect();
});

describe("/api/account", () => {
  it("exports only the logged-in account's data, as a downloadable file", async () => {
    const response = await exportAccount(new Request("http://localhost/api/account"));
    const data = (await response.json()) as {
      account: { email: string };
      decks: Array<{ name: string; cards: Array<{ lemma: string }> }>;
      sourceTexts: Array<{ content: string }>;
    };

    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(data.account.email).toBe(testUser.email);
    expect(data.decks.map((deck) => deck.name)).toEqual(["Mon deck jetable"]);
    expect(data.decks[0].cards.map((card) => card.lemma)).toEqual(["猫"]);
    expect(data.sourceTexts.map((text) => text.content)).toEqual(["猫が好きです。"]);
  });

  it("refuses to delete without the typed confirmation", async () => {
    const response = await deleteAccount(
      new Request("http://localhost/api/account", { method: "DELETE", body: JSON.stringify({ confirmation: "oui" }) }),
    );

    expect(response.status).toBe(400);
    expect(await prisma.user.count({ where: { id: testUser.id } })).toBe(1);
  });

  it("deletes the account and everything attached to it, and nothing else", async () => {
    const response = await deleteAccount(
      new Request("http://localhost/api/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "SUPPRIMER" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await prisma.user.count({ where: { id: testUser.id } })).toBe(0);
    expect(await prisma.deck.count({ where: { id: myDeckId } })).toBe(0);
    expect(await prisma.card.count({ where: { deckId: myDeckId } })).toBe(0);
    expect(await prisma.sourceText.count({ where: { userId: testUser.id } })).toBe(0);
    expect(await prisma.deck.count({ where: { userId: otherUserId } })).toBe(1);
  });
});
