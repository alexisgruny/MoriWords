import { describe, expect, it } from "vitest";

import { buildQuizChoices, normalizeCardPayload } from "./card-utils";

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
