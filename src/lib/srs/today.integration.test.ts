// Vraie DB Postgres : résumé du jour d'un compte jetable, aucun appel à Claude.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { getTodaySummary } from "./today";

const DAY_MS = 24 * 60 * 60 * 1000;
let userId = "";
let otherUserId = "";

beforeAll(async () => {
  userId = (await createTestUser("today")).id;
  otherUserId = (await createTestUser("today-other")).id;
  const now = Date.now();

  const deck = await prisma.deck.create({ data: { userId, name: "Deck jetable" } });
  const due = await prisma.card.create({
    data: { deckId: deck.id, lemma: "明日", dueAt: new Date(now - DAY_MS) },
  });
  await prisma.card.create({
    data: { deckId: deck.id, lemma: "一緒", dueAt: new Date(now + 30 * DAY_MS), interval: 30 },
  });
  await prisma.reviewLog.create({
    data: { cardId: due.id, quality: 4, interval: 1, easeFactor: 2.5, repetitions: 1, reviewedAt: new Date(now) },
  });

  // Données d'un autre compte : ne doivent jamais être comptées.
  const otherDeck = await prisma.deck.create({ data: { userId: otherUserId, name: "Autre deck" } });
  await prisma.card.create({ data: { deckId: otherDeck.id, lemma: "猫", dueAt: new Date(now - DAY_MS) } });
});

afterAll(async () => {
  await deleteTestUser(userId);
  await deleteTestUser(otherUserId);
  await prisma.$disconnect();
});

describe("getTodaySummary", () => {
  it("counts only the account's due, total and mature cards, and today's reviews", async () => {
    const summary = await getTodaySummary(userId);

    expect(summary).toMatchObject({ dueCount: 1, totalCards: 2, matureCards: 1, reviewsToday: 1 });
    expect(summary.streak).toMatchObject({ currentStreak: 1, reviewedToday: true });
  });

  it("returns an empty summary for a brand new account", async () => {
    const fresh = await createTestUser("today-fresh");

    try {
      expect(await getTodaySummary(fresh.id)).toMatchObject({ dueCount: 0, totalCards: 0, reviewsToday: 0 });
    } finally {
      await deleteTestUser(fresh.id);
    }
  });
});
