// Vraie DB Postgres : progression JLPT d'un compte jetable, sans Claude.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { WORD_LEVELS } from "@/lib/difficulty/classify";
import { prisma } from "@/lib/db/prisma";
import { getJlptProgress } from "./jlpt-progress";

let userId = "";

beforeAll(async () => {
  userId = (await createTestUser("progress")).id;
  const deckA = await prisma.deck.create({ data: { userId, name: "Deck A" } });
  const deckB = await prisma.deck.create({ data: { userId, name: "Deck B" } });
  await prisma.card.createMany({
    data: [
      // 猫 réussi une fois dans A, bien ancré dans B : compté une seule fois, bien ancré.
      { deckId: deckA.id, lemma: "猫", repetitions: 1, interval: 1 },
      { deckId: deckB.id, lemma: "猫", repetitions: 4, interval: 30 },
      // 明日 jamais réussi : ni appris ni ancré.
      { deckId: deckA.id, lemma: "明日", repetitions: 0, interval: 0 },
      // Mot hors listes : ignoré.
      { deckId: deckA.id, lemma: "ぴかぴかちゅう", repetitions: 3, interval: 10 },
    ],
  });
});

afterAll(async () => {
  await deleteTestUser(userId);
  await prisma.$disconnect();
});

describe("getJlptProgress", () => {
  it("counts each word once, in its best state, per JLPT level", async () => {
    const levels = await getJlptProgress(userId);
    const n5 = levels.find((level) => level.level === "N5")!;

    expect(levels.map((level) => level.level)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
    expect(n5).toMatchObject({ learned: 1, mastered: 1 });
    expect(n5.total).toBe(Object.values(WORD_LEVELS).filter((level) => level === "N5").length);
    expect(levels.filter((level) => level.level !== "N5").every((level) => level.learned === 0)).toBe(true);
  });
});
