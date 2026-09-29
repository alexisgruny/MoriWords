// Vraie DB Postgres : réutilisation des textes générés entre comptes, sans Claude.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { reuseSharedText } from "./shared-texts";

const CONTENT = `テスト用のセリフ ${Date.now()}`;
let authorId = "";
let readerId = "";

beforeAll(async () => {
  authorId = (await createTestUser("shared-author")).id;
  readerId = (await createTestUser("shared-reader")).id;
  await prisma.sourceText.create({
    data: { userId: authorId, content: CONTENT, title: "Test", origin: "anime-quote", category: "anime" },
  });
  // Un texte collé à la main n'est jamais partagé.
  await prisma.sourceText.create({ data: { userId: authorId, content: `${CONTENT} privé`, origin: "manual" } });
});

afterAll(async () => {
  await deleteTestUser(authorId);
  await deleteTestUser(readerId);
  await prisma.$disconnect();
});

describe("reuseSharedText", () => {
  it("copies another account's generated texts once each, then asks for a new generation", async () => {
    const received: string[] = [];

    // Le pool peut contenir d'autres textes récents : on le vide entièrement.
    for (let i = 0; i < 60; i += 1) {
      const copy = await reuseSharedText(readerId, "anime-quote");
      if (!copy) {
        break;
      }
      expect(copy.userId).toBe(readerId);
      received.push(copy.content);
    }

    expect(received).toContain(CONTENT);
    expect(new Set(received).size).toBe(received.length);
    expect(received).not.toContain(`${CONTENT} privé`);
    await expect(reuseSharedText(readerId, "anime-quote")).resolves.toBeNull();
  });

  it("never hands an account its own texts", async () => {
    const copy = await reuseSharedText(authorId, "anime-quote");
    expect(copy?.content).not.toBe(CONTENT);
    if (copy) {
      await prisma.sourceText.delete({ where: { id: copy.id } });
    }
  });
});
