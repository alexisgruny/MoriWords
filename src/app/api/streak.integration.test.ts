// Vraie DB Postgres (pas de mock nécessaire : cette route ne fait qu'agréger
// des ReviewLog déjà existants, aucun appel à Claude).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser } = vi.hoisted(() => ({ testUser: { id: "", email: "" } }));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { GET as getStreak } from "@/app/api/streak/route";

const deckIdsToCleanUp: string[] = [];

beforeAll(async () => {
  Object.assign(testUser, await createTestUser("streak"));
});

afterAll(async () => {
  await deleteTestUser(testUser.id);
  await prisma.deck.deleteMany({ where: { id: { in: deckIdsToCleanUp } } });
  await prisma.$disconnect();
});

async function createCardWithReviews(reviewDates: Date[]) {
  const deck = await prisma.deck.create({ data: { userId: testUser.id, name: `Streak test deck ${Date.now()}` } });
  deckIdsToCleanUp.push(deck.id);
  const card = await prisma.card.create({
    data: { deckId: deck.id, lemma: "話す", meaning: "parler", sourceLanguage: "ja", targetLanguage: "fr" },
  });

  for (const reviewedAt of reviewDates) {
    await prisma.reviewLog.create({
      data: { cardId: card.id, quality: 5, interval: 1, easeFactor: 2.5, repetitions: 1, reviewedAt },
    });
  }

  return card.id;
}

describe("GET /api/streak", () => {
  it("reflects a real review logged today", async () => {
    await createCardWithReviews([new Date()]);

    const response = await getStreak(new Request("http://localhost/api/streak"));
    const body = (await response.json()) as { currentStreak: number; reviewedToday: boolean };

    expect(response.status).toBe(200);
    // >= 1 plutôt que === 1 : d'autres tests/décks peuvent avoir ajouté des
    // révisions aujourd'hui en parallèle (voir la note sur la flakiness
    // partagée de la DB locale dans les autres fichiers d'intégration).
    expect(body.currentStreak).toBeGreaterThanOrEqual(1);
    expect(body.reviewedToday).toBe(true);
  });
});
