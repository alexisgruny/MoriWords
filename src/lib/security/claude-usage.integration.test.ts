// Vraie DB Postgres (compteurs et table ClaudeUsage), aucun appel à Claude.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { consumeUserClaudeQuota, recordClaudeUsage, runWithClaudeContext } from "./claude-usage";

const ACTION = `test-usage-${Date.now()}`;
let userId = "";

beforeAll(async () => {
  userId = (await createTestUser("claude-usage")).id;
});

afterEach(() => {
  delete process.env.CLAUDE_MAX_CALLS_PER_USER_PER_DAY;
});

afterAll(async () => {
  await prisma.claudeUsage.deleteMany({ where: { action: ACTION } });
  await prisma.rateLimitCounter.deleteMany({ where: { key: { startsWith: `claude:user:${userId}` } } });
  await deleteTestUser(userId);
  await prisma.$disconnect();
});

describe("consumeUserClaudeQuota", () => {
  it("has no per-account quota outside a request context", async () => {
    await expect(consumeUserClaudeQuota()).resolves.toBe(true);
  });

  it("refuses once the account has used its daily quota", async () => {
    process.env.CLAUDE_MAX_CALLS_PER_USER_PER_DAY = "2";

    const results = await runWithClaudeContext({ userId, action: ACTION }, async () => [
      await consumeUserClaudeQuota(),
      await consumeUserClaudeQuota(),
      await consumeUserClaudeQuota(),
    ]);

    expect(results).toEqual([true, true, false]);
  });
});

describe("recordClaudeUsage", () => {
  it("records tokens for the account and action of the current request only", async () => {
    await recordClaudeUsage({ input_tokens: 1, output_tokens: 1 });
    await runWithClaudeContext({ userId, action: ACTION }, () =>
      recordClaudeUsage({ input_tokens: 120, output_tokens: 45 }),
    );

    const rows = await prisma.claudeUsage.findMany({ where: { action: ACTION } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId, inputTokens: 120, outputTokens: 45 });
  });
});
