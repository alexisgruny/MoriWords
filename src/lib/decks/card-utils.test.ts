import { describe, expect, it } from "vitest";

import { normalizeCardPayload } from "./card-utils";

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
