import { describe, expect, it } from "vitest";

import { cardsToAnkiTsv } from "./anki";

describe("cardsToAnkiTsv", () => {
  it("includes the Anki plain-text import header directives", () => {
    const result = cardsToAnkiTsv([]);
    const lines = result.split("\n");

    expect(lines).toEqual(["#separator:tab", "#html:false", "#columns:Front\tBack"]);
  });

  it("puts the lemma and reading in Front and the meaning in Back", () => {
    const result = cardsToAnkiTsv([{ lemma: "食べる", reading: "たべる", meaning: "manger" }]);

    expect(result).toContain("食べる (たべる)\tmanger");
  });

  it("falls back to just the lemma when there is no reading", () => {
    const result = cardsToAnkiTsv([{ lemma: "私", reading: null, meaning: "je / moi" }]);

    expect(result).toContain("私\tje / moi");
  });

  it("falls back to a placeholder when there is no meaning", () => {
    const result = cardsToAnkiTsv([{ lemma: "猫", reading: "ねこ", meaning: null }]);

    expect(result).toContain("猫 (ねこ)\tSens à compléter");
  });

  it("strips tabs and newlines from fields so they cannot break the TSV structure", () => {
    const result = cardsToAnkiTsv([
      { lemma: "test", reading: "a\tb", meaning: "line1\nline2\r\nline3" },
    ]);
    const dataLine = result.split("\n").slice(3).join("\n");

    expect(dataLine.split("\t")).toHaveLength(2);
    expect(dataLine).not.toContain("\n");
  });

  it("exports one line per card, in order", () => {
    const result = cardsToAnkiTsv([
      { lemma: "一", reading: "いち", meaning: "un" },
      { lemma: "二", reading: "に", meaning: "deux" },
    ]);
    const dataLines = result.split("\n").slice(3);

    expect(dataLines).toEqual(["一 (いち)\tun", "二 (に)\tdeux"]);
  });
});
