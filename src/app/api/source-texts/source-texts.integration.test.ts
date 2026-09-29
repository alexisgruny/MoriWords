// Vraie DB Postgres : un texte collé reste privé, même si le client tente de
// le faire passer pour un texte généré (pool partagé entre comptes).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser } = vi.hoisted(() => ({ testUser: { id: "", email: "" } }));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { reuseSharedText } from "@/lib/feeds/shared-texts";
import { POST as createSourceText } from "@/app/api/source-texts/route";

const CONTENT = `テキスト注入 ${Date.now()}`;
let otherUserId = "";

beforeAll(async () => {
  Object.assign(testUser, await createTestUser("source-texts"));
  otherUserId = (await createTestUser("source-texts-other")).id;
});

afterAll(async () => {
  await deleteTestUser(testUser.id);
  await deleteTestUser(otherUserId);
  await prisma.$disconnect();
});

describe("POST /api/source-texts", () => {
  it("ignores a client-chosen origin, so a pasted text never reaches the shared pool", async () => {
    const response = await createSourceText(
      new Request("http://localhost/api/source-texts", {
        method: "POST",
        body: JSON.stringify({
          content: CONTENT,
          origin: "anime-quote",
          sourceUrl: "javascript:alert(1)",
          sourceLanguage: "xx",
        }),
      }),
    );
    const { sourceText } = (await response.json()) as {
      sourceText: { origin: string; sourceUrl: string | null; sourceLanguage: string };
    };

    expect(response.status).toBe(201);
    expect(sourceText).toMatchObject({ origin: "manual", sourceUrl: null, sourceLanguage: "ja" });

    const received: string[] = [];
    for (let i = 0; i < 60; i += 1) {
      const copy = await reuseSharedText(otherUserId, "anime-quote");
      if (!copy) break;
      received.push(copy.content);
    }
    expect(received).not.toContain(CONTENT);
  });

  it("refuses a title that is not text", async () => {
    const response = await createSourceText(
      new Request("http://localhost/api/source-texts", { method: "POST", body: JSON.stringify({ content: "猫", title: 42 }) }),
    );
    expect(response.status).toBe(400);
  });
});
