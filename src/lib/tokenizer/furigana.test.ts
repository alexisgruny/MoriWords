import { describe, expect, it } from "vitest";

import { furiganaParts, segmentText } from "./furigana";
import type { TokenResult } from "./types";

const token = (surface: string, reading?: string): TokenResult => ({
  surface,
  baseForm: surface,
  reading,
  partOfSpeech: "名詞",
  difficulty: "N5",
  position: 0,
});

describe("furiganaParts", () => {
  it("puts the reading over the kanji only, not over okurigana", () => {
    expect(furiganaParts("食べる", "たべる")).toEqual([{ text: "食", ruby: "た" }, { text: "べる" }]);
    expect(furiganaParts("頑張ろ", "がんばろ")).toEqual([{ text: "頑張", ruby: "がんば" }, { text: "ろ" }]);
    expect(furiganaParts("お茶", "おちゃ")).toEqual([{ text: "お" }, { text: "茶", ruby: "ちゃ" }]);
    expect(furiganaParts("明日", "あした")).toEqual([{ text: "明日", ruby: "あした" }]);
  });

  it("adds nothing to words written in kana", () => {
    expect(furiganaParts("あきらめ", "あきらめ")).toEqual([{ text: "あきらめ" }]);
    expect(furiganaParts("コーヒー", "こーひー")).toEqual([{ text: "コーヒー" }]);
    expect(furiganaParts("猫")).toEqual([{ text: "猫" }]);
  });
});

describe("segmentText", () => {
  it("places words back in the original text, keeping punctuation and line breaks", () => {
    const segments = segmentText("猫が好き！\n本当。", [token("猫"), token("が"), token("好き"), token("本当")]);
    expect(segments.map((segment) => [segment.text, Boolean(segment.token)])).toEqual([
      ["猫", true],
      ["が", true],
      ["好き", true],
      ["！\n", false],
      ["本当", true],
      ["。", false],
    ]);
  });

  it("skips a word that is no longer in the text", () => {
    expect(segmentText("猫です", [token("犬"), token("猫")]).map((segment) => segment.text)).toEqual(["猫", "です"]);
  });
});
