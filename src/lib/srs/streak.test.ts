import { describe, expect, it } from "vitest";

import { computeStreak } from "./streak";

const NOW = new Date(2026, 8, 27, 15, 0, 0); // 27 septembre 2026, 15h (mois 0-indexé)

function daysAgo(n: number): Date {
  const date = new Date(NOW);
  date.setDate(date.getDate() - n);
  return date;
}

describe("computeStreak", () => {
  it("returns zero for no review history", () => {
    expect(computeStreak([], NOW)).toEqual({ currentStreak: 0, longestStreak: 0, reviewedToday: false });
  });

  it("counts today as day 1 when reviewed today", () => {
    const result = computeStreak([daysAgo(0)], NOW);
    expect(result).toEqual({ currentStreak: 1, longestStreak: 1, reviewedToday: true });
  });

  it("keeps the streak alive if reviewed yesterday but not yet today", () => {
    const result = computeStreak([daysAgo(1), daysAgo(2)], NOW);
    expect(result.currentStreak).toBe(2);
    expect(result.reviewedToday).toBe(false);
  });

  it("breaks the streak if the last review was two days ago", () => {
    const result = computeStreak([daysAgo(2), daysAgo(3)], NOW);
    expect(result.currentStreak).toBe(0);
    expect(result.reviewedToday).toBe(false);
  });

  it("counts consecutive days correctly, ignoring duplicate same-day entries", () => {
    const result = computeStreak([daysAgo(0), daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(2)], NOW);
    expect(result.currentStreak).toBe(3);
    expect(result.reviewedToday).toBe(true);
  });

  it("stops counting at the first gap", () => {
    const result = computeStreak([daysAgo(0), daysAgo(1), daysAgo(3), daysAgo(4)], NOW);
    expect(result.currentStreak).toBe(2);
  });

  it("tracks the longest streak separately from the current one", () => {
    // Une série de 5 jours il y a longtemps, puis une pause, puis 2 jours récents.
    const result = computeStreak(
      [daysAgo(0), daysAgo(1), daysAgo(20), daysAgo(21), daysAgo(22), daysAgo(23), daysAgo(24)],
      NOW,
    );
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
  });

  it("uses the same day for reviews at different times of day", () => {
    const morning = new Date(2026, 8, 27, 7, 0, 0);
    const evening = new Date(2026, 8, 27, 23, 0, 0);
    const result = computeStreak([morning, evening], NOW);
    expect(result.currentStreak).toBe(1);
  });
});
