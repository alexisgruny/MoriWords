// Vraie DB Postgres : parcours « terminé » (toutes les leçons ou palier N5).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser } = vi.hoisted(() => ({ testUser: { id: "", email: "" } }));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));

import { GET, PATCH } from "@/app/api/course/route";
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

describe("PATCH /api/course", () => {
  const patch = (body: unknown) =>
    PATCH(new Request("http://localhost/api/course", { method: "PATCH", body: JSON.stringify(body) }));

  it("hides the course for someone who already has the basics, and can show it again", async () => {
    await prisma.examAttempt.deleteMany({ where: { userId: testUser.id } });
    expect(await status()).toMatchObject({ finished: false, hideCourse: false });

    expect((await patch({ hideCourse: true })).status).toBe(200);
    expect(await status()).toMatchObject({ finished: true, hideCourse: true });

    await patch({ hideCourse: false });
    expect(await status()).toMatchObject({ finished: false, hideCourse: false });
  });

  it("rejects anything but a boolean", async () => {
    expect((await patch({ hideCourse: "oui" })).status).toBe(400);
  });
});
