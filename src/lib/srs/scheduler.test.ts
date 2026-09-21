import { describe, expect, it } from "vitest";

import { scheduleReview } from "./scheduler";

describe("scheduleReview", () => {
  it("creates a first interval for a successful review", () => {
    const nextState = scheduleReview({
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      dueAt: new Date("2026-01-01T00:00:00.000Z"),
    }, 4);

    expect(nextState.repetitions).toBe(1);
    expect(nextState.interval).toBe(1);
    expect(nextState.easeFactor).toBeCloseTo(2.52, 5);
    expect(nextState.dueAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("resets a failed card to a short retry window", () => {
    const nextState = scheduleReview({
      repetitions: 2,
      interval: 3,
      easeFactor: 2.3,
      dueAt: new Date("2026-01-01T00:00:00.000Z"),
    }, 2);

    expect(nextState.repetitions).toBe(0);
    expect(nextState.interval).toBe(0);
    expect(nextState.easeFactor).toBeCloseTo(2.1, 5);
    expect(nextState.dueAt.getTime()).toBeGreaterThan(Date.now());
  });
});
