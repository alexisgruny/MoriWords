// Vraie DB Postgres : réussite par élément pour les pages de référence.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser } = vi.hoisted(() => ({ testUser: { id: "", email: "" } }));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { POST as recordKanaAttempt } from "@/app/api/exercise-attempts/route";
import { getMastery } from "./mastery";

const kana = (body: unknown) =>
  recordKanaAttempt(new Request("http://localhost/api/exercise-attempts", { method: "POST", body: JSON.stringify(body) }));

beforeAll(async () => {
  Object.assign(testUser, await createTestUser("mastery"));
});

afterAll(async () => {
  await deleteTestUser(testUser.id);
  await prisma.$disconnect();
});

describe("getMastery", () => {
  it("records kana answers and counts them per kana, refusing unknown kana", async () => {
    expect((await kana({ kana: "か", correct: true })).status).toBe(201);
    expect((await kana({ kana: "か", correct: false })).status).toBe(201);
    expect((await kana({ kana: "x", correct: true })).status).toBe(400);
    expect((await kana({ kana: "か" })).status).toBe(400);

    expect(await getMastery(testUser.id, "kana")).toEqual({ か: { total: 2, correct: 1 } });
  });

  it("groups both kanji exercise directions under the kanji, including older attempts keyed by readings", async () => {
    const entry = JLPT_KANJI.find((candidate) => candidate.kanji === "食")!;
    const readings = [...entry.onReadings, ...entry.kunReadings].join("・");

    await prisma.exerciseAttempt.createMany({
      data: [
        { userId: testUser.id, source: "kanji", focus: readings, level: "N5", correct: true },
        { userId: testUser.id, source: "kanji", focus: "食", level: "N5", correct: true },
        { userId: testUser.id, source: "kanji-reading", focus: "食", level: "N5", correct: false },
        { userId: testUser.id, source: "grammar", focus: "〜は〜です", level: "N5", correct: true },
      ],
    });

    expect(await getMastery(testUser.id, "kanji")).toEqual({ 食: { total: 3, correct: 2 } });
    expect(await getMastery(testUser.id, "grammar")).toEqual({ "〜は〜です": { total: 1, correct: 1 } });
    expect(await getMastery(testUser.id, "conjugation")).toEqual({});
  });
});
