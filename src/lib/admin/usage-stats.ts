import { prisma } from "@/lib/db/prisma";

// Tarif de Claude Haiku 4.5 (dollars par million de tokens). À mettre à jour
// si le modèle ou les prix changent.
const USD_PER_MILLION_INPUT = 1;
const USD_PER_MILLION_OUTPUT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
export const USAGE_WINDOW_DAYS = 30;

export function costUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens * USD_PER_MILLION_INPUT + outputTokens * USD_PER_MILLION_OUTPUT) / 1_000_000;
}

// L'administration est réservée au compte du propriétaire (OWNER_EMAIL).
export function isAdminEmail(email: string, env: Partial<Record<"OWNER_EMAIL", string>> = process.env): boolean {
  const ownerEmail = env.OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(ownerEmail) && email.trim().toLowerCase() === ownerEmail;
}

export type UsageTotals = { calls: number; inputTokens: number; outputTokens: number; costUsd: number };

export type UsageStats = {
  today: UsageTotals;
  last7Days: UsageTotals;
  last30Days: UsageTotals;
  // Un point par jour (UTC) sur 30 jours, jours sans appel compris.
  daily: Array<{ day: string; calls: number; costUsd: number }>;
  byAction: Array<UsageTotals & { action: string }>;
  byAccount: Array<UsageTotals & { email: string | null }>;
  accounts: { total: number; newLast7Days: number };
};

function totals(calls: number, inputTokens: number | null, outputTokens: number | null): UsageTotals {
  const input = inputTokens ?? 0;
  const output = outputTokens ?? 0;
  return { calls, inputTokens: input, outputTokens: output, costUsd: costUsd(input, output) };
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function totalsSince(since: Date): Promise<UsageTotals> {
  const result = await prisma.claudeUsage.aggregate({
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { inputTokens: true, outputTokens: true },
  });
  return totals(result._count._all, result._sum.inputTokens, result._sum.outputTokens);
}

// Coût réel de Claude (appels hors cache) sur les 30 derniers jours : par
// jour, par action et par compte, pour suivre la marge par utilisateur.
export async function getUsageStats(now: Date = new Date()): Promise<UsageStats> {
  const today = startOfUtcDay(now);
  const since7 = new Date(today.getTime() - 6 * DAY_MS);
  const since30 = new Date(today.getTime() - (USAGE_WINDOW_DAYS - 1) * DAY_MS);
  const window = { createdAt: { gte: since30 } };
  const sums = { _count: { _all: true }, _sum: { inputTokens: true, outputTokens: true } } as const;

  const [todayTotals, last7Days, last30Days, dailyRows, actionRows, accountRows, totalAccounts, newAccounts] =
    await Promise.all([
      totalsSince(today),
      totalsSince(since7),
      totalsSince(since30),
      prisma.$queryRaw<Array<{ day: string; calls: number; input: number | null; output: number | null }>>`
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
               count(*)::int AS calls,
               sum("inputTokens")::int AS input,
               sum("outputTokens")::int AS output
        FROM "ClaudeUsage"
        WHERE "createdAt" >= ${since30}
        GROUP BY 1`,
      prisma.claudeUsage.groupBy({ by: ["action"], where: window, ...sums }),
      prisma.claudeUsage.groupBy({ by: ["userId"], where: window, ...sums }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since7 } } }),
    ]);

  const byDay = new Map(dailyRows.map((row) => [row.day, row]));
  const daily = Array.from({ length: USAGE_WINDOW_DAYS }, (_, index) => {
    const day = new Date(since30.getTime() + index * DAY_MS).toISOString().slice(0, 10);
    const row = byDay.get(day);
    return { day, calls: row?.calls ?? 0, costUsd: costUsd(row?.input ?? 0, row?.output ?? 0) };
  });

  const byCost = <T extends UsageTotals>(a: T, b: T) => b.costUsd - a.costUsd;

  const byAction = actionRows
    .map((row) => ({ action: row.action, ...totals(row._count._all, row._sum.inputTokens, row._sum.outputTokens) }))
    .sort(byCost);

  const userIds = accountRows.map((row) => row.userId).filter((id): id is string => id !== null);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });
  const emailById = new Map(users.map((user) => [user.id, user.email]));

  const byAccount = accountRows
    .map((row) => ({
      // null : compte supprimé depuis (lignes détachées, voir ClaudeUsage).
      email: row.userId ? (emailById.get(row.userId) ?? null) : null,
      ...totals(row._count._all, row._sum.inputTokens, row._sum.outputTokens),
    }))
    .sort(byCost)
    .slice(0, 20);

  return {
    today: todayTotals,
    last7Days,
    last30Days,
    daily,
    byAction,
    byAccount,
    accounts: { total: totalAccounts, newLast7Days: newAccounts },
  };
}
