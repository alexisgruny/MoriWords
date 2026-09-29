import { describe, expect, it } from "vitest";

import { fitsGrammarLevel } from "./exercises";

describe("fitsGrammarLevel", () => {
  it("accepts short N5 sentences, allowing common N4 kanji like 私", () => {
    expect(fitsGrammarLevel("私は学生です。", "N5")).toBe(true);
    expect(fitsGrammarLevel("ともだちと えいがを 見ます。", "N5")).toBe(true);
  });

  it("refuses N5 sentences that are too long or use harder kanji", () => {
    expect(fitsGrammarLevel("昨日、駅の近くの新しい店で友達と一緒に晩ご飯を食べました。", "N5")).toBe(false);
    // 達 est N3 : trop dur pour un point N5 (écrire ともだち).
    expect(fitsGrammarLevel("友達です。", "N5")).toBe(false);
    expect(fitsGrammarLevel("友達です。", "N3")).toBe(true);
  });
});
