import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { getExerciseStats } from "./exercise-stats";

// Préfixe unique par exécution : isole ces tests des tentatives réelles (ou
// d'autres runs en parallèle) sans avoir à vider toute la table.
const RUN_ID = `test-stats-${Date.now()}`;

async function seedAttempts(rows: Array<{ source: string; focus: string; level: string | null; correct: boolean }>) {
  await prisma.exerciseAttempt.createMany({
    data: rows.map((row) => ({ ...row, userId, focus: `${RUN_ID}:${row.focus}` })),
  });
}

// Les statistiques sont propres à chaque compte : un compte jetable isole ce
// fichier des autres tests et des vraies données.
let userId = "";

beforeAll(async () => {
  userId = (await createTestUser("exercise-stats")).id;
});

afterAll(async () => {
  await deleteTestUser(userId);
});

afterEach(async () => {
  await prisma.exerciseAttempt.deleteMany({ where: { focus: { startsWith: RUN_ID } } });
});

describe("getExerciseStats", () => {
  it("computes a success rate per source, counting only this run's seeded rows", async () => {
    await seedAttempts([
      { source: "grammar", focus: "n5-wa-desu", level: "N5", correct: true },
      { source: "grammar", focus: "n5-wa-desu", level: "N5", correct: true },
      { source: "grammar", focus: "n4-to-omou", level: "N4", correct: false },
      { source: "kanji", focus: "食", level: "N5", correct: true },
    ]);

    const stats = await getExerciseStats(userId);

    const grammar = stats.bySource.find((entry) => entry.source === "grammar")!;
    expect(grammar.total).toBeGreaterThanOrEqual(3);
    expect(grammar.correct).toBeGreaterThanOrEqual(2);

    const kanji = stats.bySource.find((entry) => entry.source === "kanji")!;
    expect(kanji.total).toBeGreaterThanOrEqual(1);
    expect(kanji.rate).toBeGreaterThan(0);
  });

  it("flags a point as weak once it has at least 2 attempts and a low success rate", async () => {
    await seedAttempts([
      { source: "conjugation", focus: "n1-literary-negative", level: "N1", correct: false },
      { source: "conjugation", focus: "n1-literary-negative", level: "N1", correct: false },
      { source: "conjugation", focus: "n1-literary-negative", level: "N1", correct: true },
    ]);

    const stats = await getExerciseStats(userId);

    const weak = stats.weakPoints.find((point) => point.focus === `${RUN_ID}:n1-literary-negative`);
    expect(weak).toBeDefined();
    expect(weak?.total).toBe(3);
    expect(weak?.correct).toBe(1);
    expect(weak?.rate).toBeCloseTo(1 / 3);
  });

  it("does not flag a point with a single attempt, even a wrong one", async () => {
    await seedAttempts([{ source: "kanji", focus: "単発", level: "N3", correct: false }]);

    const stats = await getExerciseStats(userId);

    expect(stats.weakPoints.some((point) => point.focus === `${RUN_ID}:単発`)).toBe(false);
  });

  it("does not flag a point with a perfect success rate", async () => {
    await seedAttempts([
      { source: "grammar", focus: "toujours-bon", level: "N5", correct: true },
      { source: "grammar", focus: "toujours-bon", level: "N5", correct: true },
    ]);

    const stats = await getExerciseStats(userId);

    expect(stats.weakPoints.some((point) => point.focus === `${RUN_ID}:toujours-bon`)).toBe(false);
  });
});
