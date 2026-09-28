import { describe, expect, it } from "vitest";

import { KANA, filterKana, isCorrectKanaAnswer, toKatakana } from "./kana";

const byKana = (kana: string) => KANA.find((entry) => entry.kana === kana)!;

describe("KANA", () => {
  it("has the 46 base kana, 25 voiced and 33 combined sounds in each script", () => {
    for (const script of ["hiragana", "katakana"] as const) {
      const entries = KANA.filter((entry) => entry.script === script);
      expect(entries.filter((entry) => entry.group === "base")).toHaveLength(46);
      expect(entries.filter((entry) => entry.group === "dakuten")).toHaveLength(25);
      expect(entries.filter((entry) => entry.group === "combo")).toHaveLength(33);
    }
  });

  it("never lists the same kana twice", () => {
    expect(new Set(KANA.map((entry) => entry.kana)).size).toBe(KANA.length);
  });

  it("derives katakana from hiragana, combined sounds included", () => {
    expect(toKatakana("か")).toBe("カ");
    expect(toKatakana("ん")).toBe("ン");
    expect(toKatakana("しゃ")).toBe("シャ");
    expect(byKana("ア").counterpart).toBe("あ");
  });
});

describe("filterKana", () => {
  it("filters by script, group and romaji prefix or kana", () => {
    const ks = filterKana(KANA, "hiragana", "base", "k").map((entry) => entry.kana);
    expect(ks).toEqual(["か", "き", "く", "け", "こ"]);
    expect(filterKana(KANA, "katakana", "all", "あ").map((entry) => entry.kana)).toEqual(["ア"]);
  });
});

describe("isCorrectKanaAnswer", () => {
  it("accepts Hepburn and the common alternative spellings, ignoring case and spaces", () => {
    expect(isCorrectKanaAnswer(byKana("し"), "shi")).toBe(true);
    expect(isCorrectKanaAnswer(byKana("し"), " SI ")).toBe(true);
    expect(isCorrectKanaAnswer(byKana("ツ"), "tu")).toBe(true);
    expect(isCorrectKanaAnswer(byKana("ん"), "nn")).toBe(true);
    expect(isCorrectKanaAnswer(byKana("じゃ"), "ja")).toBe(true);
  });

  it("rejects a wrong reading", () => {
    expect(isCorrectKanaAnswer(byKana("さ"), "shi")).toBe(false);
    expect(isCorrectKanaAnswer(byKana("き"), "")).toBe(false);
  });
});
