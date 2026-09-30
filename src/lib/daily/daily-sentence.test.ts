import { describe, expect, it } from "vitest";

import { GRAMMAR_LEVELS } from "@/lib/grammar/points";
import { dailySentence, dayNumber } from "./daily-sentence";

describe("phrase du jour", () => {
  it("stays the same all day long and changes the next day", () => {
    const morning = new Date(2026, 9, 1, 0, 5);
    const evening = new Date(2026, 9, 1, 23, 55);
    const tomorrow = new Date(2026, 9, 2, 8, 0);
    expect(dailySentence("N5", morning)).toEqual(dailySentence("N5", evening));
    expect(dailySentence("N5", tomorrow).ja).not.toBe(dailySentence("N5", morning).ja);
    expect(dayNumber(tomorrow) - dayNumber(morning)).toBe(1);
  });

  it("gives a translated sentence of the requested level, for every level", () => {
    for (const level of GRAMMAR_LEVELS) {
      const sentence = dailySentence(level, new Date(2026, 9, 1));
      expect(sentence.level).toBe(level);
      expect(sentence.ja.length).toBeGreaterThan(0);
      expect(sentence.fr.length).toBeGreaterThan(0);
    }
  });

  it("does not repeat the same grammar point two days in a row over a month", () => {
    for (let day = 1; day < 31; day += 1) {
      const today = dailySentence("N5", new Date(2026, 9, day));
      const next = dailySentence("N5", new Date(2026, 9, day + 1));
      expect(next.pattern, `jour ${day}`).not.toBe(today.pattern);
    }
  });
});
