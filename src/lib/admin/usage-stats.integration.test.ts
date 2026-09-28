// Vraie DB Postgres (table ClaudeUsage), aucun appel à Claude.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { USAGE_WINDOW_DAYS, costUsd, getUsageStats, isAdminEmail } from "./usage-stats";

// Action propre à ce fichier : les autres tests peuvent écrire dans la même
// table en parallèle, on ne vérifie que nos lignes.
const ACTION = `test-admin-${Date.now()}`;
let user = { id: "", email: "" };

beforeAll(async () => {
  user = await createTestUser("admin-stats");
  await prisma.claudeUsage.createMany({
    data: [
      { userId: user.id, action: ACTION, inputTokens: 1_000_000, outputTokens: 0 },
      { userId: user.id, action: ACTION, inputTokens: 0, outputTokens: 200_000 },
    ],
  });
});

afterAll(async () => {
  await prisma.claudeUsage.deleteMany({ where: { action: ACTION } });
  await deleteTestUser(user.id);
  await prisma.$disconnect();
});

describe("costUsd and isAdminEmail", () => {
  it("prices Haiku 4.5 tokens ($1 / M input, $5 / M output)", () => {
    expect(costUsd(1_000_000, 0)).toBe(1);
    expect(costUsd(0, 1_000_000)).toBe(5);
    expect(costUsd(500, 100)).toBeCloseTo(0.001);
  });

  it("only accepts the configured owner email, case-insensitively", () => {
    expect(isAdminEmail("Moi@Example.com", { OWNER_EMAIL: " moi@example.com " })).toBe(true);
    expect(isAdminEmail("autre@example.com", { OWNER_EMAIL: "moi@example.com" })).toBe(false);
    expect(isAdminEmail("moi@example.com", {})).toBe(false);
  });
});

describe("getUsageStats", () => {
  it("aggregates calls and cost by action, account and day", async () => {
    const stats = await getUsageStats();

    expect(stats.byAction.find((row) => row.action === ACTION)).toMatchObject({
      calls: 2,
      inputTokens: 1_000_000,
      outputTokens: 200_000,
      costUsd: 2,
    });
    expect(stats.byAccount.find((row) => row.email === user.email)).toMatchObject({ calls: 2, costUsd: 2 });

    expect(stats.daily).toHaveLength(USAGE_WINDOW_DAYS);
    expect(stats.daily.at(-1)?.day).toBe(new Date().toISOString().slice(0, 10));
    expect(stats.daily.at(-1)!.costUsd).toBeGreaterThanOrEqual(2);
    expect(stats.today.costUsd).toBeGreaterThanOrEqual(2);
    expect(stats.last30Days.calls).toBeGreaterThanOrEqual(stats.today.calls);
  });
});
