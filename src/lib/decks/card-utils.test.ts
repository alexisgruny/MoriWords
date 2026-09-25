import { describe, expect, it } from "vitest";

import { buildQuizChoices, getCardStatus, normalizeCardPayload, pickHardestCards } from "./card-utils";

describe("normalizeCardPayload", () => {
  it("trims and preserves the core identifiers for a card", () => {
    const payload = normalizeCardPayload({
      lemma: "  食べる  ",
      surface: " 食べる ",
      reading: "  たべる  ",
      meaning: " manger ",
    });

    expect(payload).toEqual({
      lemma: "食べる",
      surface: "食べる",
      reading: "たべる",
      meaning: "manger",
    });
  });

  it("keeps null values nullable and strips empty strings", () => {
    expect(
      normalizeCardPayload({
        lemma: "読む",
        surface: "",
        reading: "  ",
        meaning: "",
      }),
    ).toEqual({
      lemma: "読む",
      surface: null,
      reading: null,
      meaning: null,
    });
  });
});

describe("buildQuizChoices", () => {
  it("always includes the correct meaning exactly once", () => {
    const choices = buildQuizChoices("manger", ["boire", "dormir", "courir", "lire"]);

    expect(choices).toContain("manger");
    expect(choices.filter((choice) => choice === "manger")).toHaveLength(1);
  });

  it("returns at most optionCount choices, all distinct", () => {
    const choices = buildQuizChoices("manger", ["boire", "dormir", "courir", "lire", "écrire"]);

    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
  });

  it("never uses the correct meaning as one of its own distractors", () => {
    const choices = buildQuizChoices("manger", ["manger", "boire", "manger", "dormir"]);

    expect(choices.filter((choice) => choice === "manger")).toHaveLength(1);
  });

  it("deduplicates the distractor pool", () => {
    const choices = buildQuizChoices("manger", ["boire", "boire", "boire"]);

    expect(choices).toEqual(expect.arrayContaining(["manger", "boire"]));
    expect(choices).toHaveLength(2);
  });

  it("falls back to fewer choices when the distractor pool is too small", () => {
    const choices = buildQuizChoices("manger", []);

    expect(choices).toEqual(["manger"]);
  });

  it("respects a custom optionCount", () => {
    const choices = buildQuizChoices("manger", ["boire", "dormir", "courir", "lire"], 2);

    expect(choices).toHaveLength(2);
    expect(choices).toContain("manger");
  });
});

describe("getCardStatus", () => {
  it("treats a never-reviewed card as new", () => {
    expect(getCardStatus({ repetitions: 0, interval: 0 })).toBe("new");
    expect(getCardStatus({})).toBe("new");
  });

  it("treats a reviewed card with a short interval as learning", () => {
    expect(getCardStatus({ repetitions: 2, interval: 6 })).toBe("learning");
  });

  it("keeps a failed card (repetitions reset to 0) as learning, not new", () => {
    expect(getCardStatus({ repetitions: 0, interval: 1, _count: { reviewLogs: 1 } })).toBe("learning");
    expect(getCardStatus({ repetitions: 0, interval: 0, _count: { reviewLogs: 0 } })).toBe("new");
  });

  it("treats a card with an interval of 21+ days as mature", () => {
    expect(getCardStatus({ repetitions: 5, interval: 21 })).toBe("mature");
    expect(getCardStatus({ repetitions: 5, interval: 60 })).toBe("mature");
  });
});

describe("pickHardestCards", () => {
  it("returns reviewed cards ordered by lowest ease factor, ignoring never-reviewed ones", () => {
    const cards = [
      { id: "a", easeFactor: 2.5, _count: { reviewLogs: 3 } },
      { id: "b", easeFactor: 1.4, _count: { reviewLogs: 2 } },
      { id: "c", easeFactor: 1.3, _count: { reviewLogs: 0 } },
      { id: "d", easeFactor: 1.9, _count: { reviewLogs: 1 } },
    ];

    expect(pickHardestCards(cards, 2).map((card) => card.id)).toEqual(["b", "d"]);
  });
});
