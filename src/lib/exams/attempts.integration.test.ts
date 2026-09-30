// Vraie DB Postgres : examens de palier d'un compte jetable.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { buildExam } from "./build-exam";
import { getExamStatuses, startExam, submitExam } from "./attempts";

let userId = "";
let otherId = "";

beforeAll(async () => {
  userId = (await createTestUser("exams")).id;
  otherId = (await createTestUser("exams-other")).id;
});

afterAll(async () => {
  await deleteTestUser(userId);
  await deleteTestUser(otherId);
  await prisma.$disconnect();
});

const HOUR = 60 * 60 * 1000;

describe("examens de palier", () => {
  it("resumes the same exam, grades it once and blocks a retry for 24 h after a fail", async () => {
    const start = new Date("2026-10-01T10:00:00Z");
    const first = await startExam(userId, "N5", start);
    const again = await startExam(userId, "N5", new Date(start.getTime() + HOUR));
    if (!first.ok || !again.ok) throw new Error("examen non lancé");
    expect(again.attemptId).toBe(first.attemptId);
    expect(again.questions).toEqual(first.questions);

    // Un autre compte ne peut pas rendre cet examen.
    const stolen = await submitExam(otherId, first.attemptId, first.questions.map(() => 0), start);
    expect(stolen).toMatchObject({ ok: false, status: 404 });

    const failed = await submitExam(userId, first.attemptId, first.questions.map(() => -1), new Date(start.getTime() + HOUR));
    expect(failed).toMatchObject({ ok: true, score: 0, passed: false });
    const twice = await submitExam(userId, first.attemptId, first.questions.map(() => -1), new Date(start.getTime() + HOUR));
    expect(twice).toMatchObject({ ok: false, status: 409 });

    const blocked = await startExam(userId, "N5", new Date(start.getTime() + 2 * HOUR));
    expect(blocked).toEqual({ ok: false, retryAt: new Date(start.getTime() + 24 * HOUR).toISOString() });
    const [n5] = await getExamStatuses(userId, new Date(start.getTime() + 2 * HOUR));
    expect(n5).toMatchObject({ level: "N5", passed: false, bestScore: 0, retryAt: blocked.ok ? null : blocked.retryAt });

    // Le lendemain, on peut repasser, et réussir.
    const retry = await startExam(userId, "N5", new Date(start.getTime() + 25 * HOUR));
    if (!retry.ok) throw new Error("repassage refusé");
    const attempt = await prisma.examAttempt.findUniqueOrThrow({ where: { id: retry.attemptId } });
    const { answers } = buildExam("N5", attempt.seed);
    const passed = await submitExam(userId, retry.attemptId, answers, new Date(start.getTime() + 26 * HOUR));
    expect(passed).toMatchObject({ ok: true, passed: true, score: answers.length });

    const statuses = await getExamStatuses(userId, new Date(start.getTime() + 27 * HOUR));
    expect(statuses.find((status) => status.level === "N5")).toMatchObject({ passed: true, retryAt: null, inProgress: false });
  });

  it("counts an unfinished exam as failed once its time is over", async () => {
    const start = new Date("2026-10-05T10:00:00Z");
    const first = await startExam(userId, "N4", start);
    if (!first.ok) throw new Error("examen non lancé");
    const late = await submitExam(userId, first.attemptId, first.questions.map(() => 0), new Date(start.getTime() + 4 * HOUR));
    expect(late).toMatchObject({ ok: false, status: 409 });
    expect(await startExam(userId, "N4", new Date(start.getTime() + 5 * HOUR))).toMatchObject({ ok: false });
  });
});
