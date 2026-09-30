import { describe, expect, it } from "vitest";

import { allowedVocabulary, fitsGrammarLevel } from "./exercises";
import { grammarPoints } from "./points";

describe("fitsGrammarLevel", () => {
  it("accepts short N5 sentences made of N5 words, allowing common N4 kanji like 私", async () => {
    expect(await fitsGrammarLevel("私は学生です。", "N5")).toBe(true);
    expect(await fitsGrammarLevel("ここに名前を書いてください。", "N5")).toBe(true);
    expect(await fitsGrammarLevel("それはいいですね。", "N5")).toBe(true);
  });

  it("treats a word after a number as a counter, and accepts beginner proper nouns", async () => {
    expect(await fitsGrammarLevel("七時に起きます。", "N5")).toBe(true);
    expect(await fitsGrammarLevel("日本に行きたいです。", "N5")).toBe(true);
  });

  it("refuses N5 sentences with a word outside the N5 list, even written in kana", async () => {
    expect(await fitsGrammarLevel("青いワンピースを着ています。", "N5")).toBe(false);
    expect(await fitsGrammarLevel("ゆっくり話してください。", "N5")).toBe(false);
    expect(await fitsGrammarLevel("ゆっくり話してください。", "N4")).toBe(true);
  });

  it("refuses N5 sentences that are too long or use harder kanji", async () => {
    expect(await fitsGrammarLevel("昨日、駅の近くの新しい店で友達と一緒に晩ご飯を食べました。", "N5")).toBe(false);
    // 友達 est un mot N5 : son écriture usuelle est admise même si 達 est N3.
    expect(await fitsGrammarLevel("友達です。", "N5")).toBe(true);
    expect(await fitsGrammarLevel("貿易の仕事です。", "N5")).toBe(false);
  });

  it("lists the allowed vocabulary only for beginner levels", () => {
    expect(allowedVocabulary("N5")).toEqual(expect.arrayContaining(["食べる", "いい", "日本"]));
    expect(allowedVocabulary("N5")!.length).toBeLessThan(allowedVocabulary("N4")!.length);
    expect(allowedVocabulary("N3")).toBeNull();
  });

  it("keeps at least one hand-written example per N5 point once too-hard ones are filtered out", async () => {
    const pointsWithout: string[] = [];
    for (const point of grammarPoints.filter((candidate) => candidate.level === "N5")) {
      const fits = await Promise.all(point.examples.map((example) => fitsGrammarLevel(example.ja, "N5")));
      if (!fits.some(Boolean)) {
        pointsWithout.push(point.pattern);
      }
    }
    expect(pointsWithout).toEqual([]);
  });
});
