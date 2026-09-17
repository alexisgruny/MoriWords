import { describe, expect, it } from "vitest";

import { mapJapaneseToken, toHiragana } from "./japanese-tokenizer";

describe("toHiragana", () => {
  it("convertit une lecture katakana en hiragana", () => {
    expect(toHiragana("タベマシタ")).toBe("たべました");
  });
});

describe("mapJapaneseToken", () => {
  it("convertit les propriétés Kuromoji vers TokenResult", () => {
    const result = mapJapaneseToken({
      surface_form: "食べました",
      basic_form: "食べる",
      reading: "たべました",
      pos: "動詞",
      word_position: 1,
    });

    expect(result).toEqual({
      surface: "食べました",
      baseForm: "食べる",
      reading: "たべました",
      partOfSpeech: "動詞",
      position: 1,
    });
  });

  it("utilise la surface et retire les lectures inconnues", () => {
    const result = mapJapaneseToken({
      surface_form: "！",
      basic_form: "*",
      reading: "*",
      pos: "記号",
      word_position: 8,
    });

    expect(result).toEqual({
      surface: "！",
      baseForm: "！",
      reading: undefined,
      partOfSpeech: "記号",
      position: 8,
    });
  });
});