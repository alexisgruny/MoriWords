import { describe, expect, it } from "vitest";

import {
  isNonLexicalToken,
  mapJapaneseToken,
  toHiragana,
} from "./japanese-tokenizer";

describe("toHiragana", () => {
  it("convertit une lecture katakana en hiragana", () => {
    expect(toHiragana("タベマシタ")).toBe("たべました");
  });
});

describe("isNonLexicalToken", () => {
  it("rejetter les ponctuations et symboles isolés comme / ? ; !", () => {
    expect(isNonLexicalToken({ surface_form: "/", pos: "記号" })).toBe(true);
    expect(isNonLexicalToken({ surface_form: "?", pos: "名詞" })).toBe(true);
    expect(isNonLexicalToken({ surface_form: ";", pos: "記号" })).toBe(true);
    expect(isNonLexicalToken({ surface_form: "!", pos: "名詞" })).toBe(true);
    expect(isNonLexicalToken({ surface_form: "日本語", pos: "名詞" })).toBe(false);
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
      difficulty: "N5",
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
      difficulty: "unknown",
      position: 8,
    });
  });

  it("tokenise un texte japonais réel", async () => {
    const { JapaneseTokenizer } = await import("./japanese-tokenizer");
    const tokenizer = new JapaneseTokenizer();
    const tokens = await tokenizer.tokenize("私は日本語を勉強します。");

    expect(tokens[0]).toMatchObject({
      surface: "私",
      baseForm: "私",
      partOfSpeech: "名詞",
      difficulty: "N5",
    });
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some((token) => token.partOfSpeech === "記号")).toBe(false);
    expect(tokens.some((token) => token.surface === "。" || token.surface === "、")).toBe(false);
  });
});