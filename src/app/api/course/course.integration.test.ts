// Vraie DB Postgres : parcours « terminé » (toutes les leçons ou palier N5).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser } = vi.hoisted(() => ({ testUser: { id: "", email: "" } }));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));

import { GET } from "@/app/api/course/route";
import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { LESSON_IDS } from "@/lib/course/lessons";
import { prisma } from "@/lib/db/prisma";

beforeAll(async () => {
  Object.assign(testUser, await createTestUser("course"));
});

afterAll(async () => {
  await deleteTestUser(testUser.id);
  await prisma.$disconnect();
});

async function status() {
  return (await (await GET(new Request("http://localhost/api/course"))).json()) as { completed: string[]; finished: boolean };
}

describe("GET /api/course", () => {
  it("is finished once every lesson is validated", async () => {
    const [first, ...rest] = [...LESSON_IDS];
    await prisma.lessonProgress.create({ data: { userId: testUser.id, lessonId: first } });
    expect(await status()).toMatchObject({ finished: false });

    await prisma.lessonProgress.createMany({ data: rest.map((lessonId) => ({ userId: testUser.id, lessonId })) });
    expect(await status()).toMatchObject({ finished: true });
  });

  it("is finished after passing the N5 palier, even without the lessons", async () => {
    await prisma.lessonProgress.deleteMany({ where: { userId: testUser.id } });
    expect(await status()).toMatchObject({ finished: false });

    await prisma.examAttempt.create({
      data: { userId: testUser.id, level: "N5", seed: 1, total: 40, finishedAt: new Date(), score: 35, passed: true },
    });
    expect(await status()).toMatchObject({ finished: true });
  });
});
