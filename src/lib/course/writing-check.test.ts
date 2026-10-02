import { describe, expect, it } from "vitest";

import { isWrittenAnswerCorrect } from "./writing-check";

describe("exercice écrit des leçons", () => {
  const answers = ["本は机の上にあります。", "ほんはつくえのうえにあります。"];

  it("accepts the kanji or the kana version, whatever the punctuation and spaces", () => {
    expect(isWrittenAnswerCorrect("本は机の上にあります", answers)).toBe(true);
    expect(isWrittenAnswerCorrect("ほんは つくえの うえに あります。", answers)).toBe(true);
    expect(isWrittenAnswerCorrect("ホンハツクエノウエニアリマス", answers)).toBe(true);
  });

  it("refuses a different sentence or an empty answer", () => {
    expect(isWrittenAnswerCorrect("ほんはつくえのしたにあります", answers)).toBe(false);
    expect(isWrittenAnswerCorrect("  ", answers)).toBe(false);
  });
});
