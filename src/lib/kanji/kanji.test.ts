import { describe, expect, it } from "vitest";

import { GRAMMAR_LEVELS } from "@/lib/grammar/points";

import { filterKanji, JLPT_KANJI } from "./kanji";

describe("JLPT_KANJI dataset", () => {
  it("has unique kanji", () => {
    const kanjiChars = JLPT_KANJI.map((entry) => entry.kanji);
    expect(new Set(kanjiChars).size).toBe(kanjiChars.length);
  });

  it("covers every JLPT level with several kanji", () => {
    for (const level of GRAMMAR_LEVELS) {
      expect(JLPT_KANJI.filter((entry) => entry.level === level).length).toBeGreaterThan(50);
    }
  });

  it("gives every kanji a meaning, a stroke count and at least one reading", () => {
    for (const entry of JLPT_KANJI) {
      expect(entry.meaning.trim(), entry.kanji).not.toBe("");
      expect(entry.strokeCount, entry.kanji).toBeGreaterThan(0);
      expect(entry.onReadings.length + entry.kunReadings.length, entry.kanji).toBeGreaterThan(0);
    }
  });
});

describe("filterKanji", () => {
  it("returns every kanji for level 'all' and an empty query", () => {
    expect(filterKanji(JLPT_KANJI, "all", "")).toHaveLength(JLPT_KANJI.length);
  });

  it("filters by level", () => {
    const n5 = filterKanji(JLPT_KANJI, "N5", "");
    expect(n5.length).toBeGreaterThan(0);
    expect(n5.every((entry) => entry.level === "N5")).toBe(true);
  });

  it("finds a kanji by its exact character", () => {
    const results = filterKanji(JLPT_KANJI, "all", "食");
    expect(results.map((entry) => entry.kanji)).toContain("食");
  });

  it("searches readings and meaning ignoring accents and case", () => {
    const byReading = filterKanji(JLPT_KANJI, "all", "たべる");
    expect(byReading.length).toBeGreaterThan(0);

    const byMeaning = filterKanji(JLPT_KANJI, "all", "MANGER");
    expect(byMeaning.length).toBeGreaterThan(0);
  });

  it("combines level and query", () => {
    const results = filterKanji(JLPT_KANJI, "N5", "水");
    expect(results.every((entry) => entry.level === "N5")).toBe(true);
  });
});
