// Vraie base Postgres (table RateLimitCounter), avec des clés propres à cette
// exécution, supprimées à la fin.
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

import { getClientIp, hitRateLimit, limitByIp } from "./rate-limit";

const RUN_ID = `test-${Date.now()}`;
const TEST_IP = `203.0.113.${Date.now() % 250}`;

afterAll(async () => {
  await prisma.rateLimitCounter.deleteMany({
    where: { OR: [{ key: { startsWith: RUN_ID } }, { key: { endsWith: TEST_IP } }] },
  });
  await prisma.$disconnect();
});

describe("hitRateLimit", () => {
  it("counts hits in the window and refuses past the limit", async () => {
    const key = `${RUN_ID}:counter`;
    const now = new Date("2026-09-28T10:00:05Z");

    const results = [];
    for (let i = 0; i < 4; i += 1) {
      results.push(await hitRateLimit(key, 3, 60, now));
    }

    expect(results.map((result) => result.allowed)).toEqual([true, true, true, false]);
    expect(results[3].count).toBe(4);
    expect(results[3].retryAfterSeconds).toBe(55);
  });

  it("starts a fresh count in the next window", async () => {
    const key = `${RUN_ID}:windows`;
    await hitRateLimit(key, 1, 60, new Date("2026-09-28T10:00:10Z"));
    const blocked = await hitRateLimit(key, 1, 60, new Date("2026-09-28T10:00:20Z"));
    const nextWindow = await hitRateLimit(key, 1, 60, new Date("2026-09-28T10:01:10Z"));

    expect(blocked.allowed).toBe(false);
    expect(nextWindow.allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("prefers x-real-ip, then the first x-forwarded-for entry, else null", () => {
    expect(getClientIp(new Request("http://x", { headers: { "x-real-ip": "1.2.3.4" } }))).toBe("1.2.3.4");
    expect(getClientIp(new Request("http://x", { headers: { "x-forwarded-for": "5.6.7.8, 10.0.0.1" } }))).toBe(
      "5.6.7.8",
    );
    expect(getClientIp(new Request("http://x"))).toBeNull();
  });
});

describe("limitByIp", () => {
  it("does nothing without an IP (local dev and tests)", async () => {
    expect(await limitByIp(new Request("http://x"), "owner-unlock")).toBeNull();
  });

  it("answers 429 with Retry-After once an IP exceeds its bucket", async () => {
    const request = () => new Request("http://x", { headers: { "x-real-ip": TEST_IP } });

    for (let i = 0; i < 10; i += 1) {
      expect(await limitByIp(request(), "owner-unlock")).toBeNull();
    }

    const refused = await limitByIp(request(), "owner-unlock");
    expect(refused?.status).toBe(429);
    expect(refused?.headers.get("Retry-After")).toBeTruthy();
  });
});
