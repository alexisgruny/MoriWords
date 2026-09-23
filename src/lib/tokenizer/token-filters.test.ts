import { describe, expect, it } from "vitest";

import { isNoiseToken } from "./token-filters";

describe("isNoiseToken", () => {
  it("flags pure romaji tokens", () => {
    expect(isNoiseToken({ surface: "PC" })).toBe(true);
    expect(isNoiseToken({ surface: "AI" })).toBe(true);
    expect(isNoiseToken({ surface: "J" })).toBe(true);
  });

  it("flags pure arabic-digit tokens", () => {
    expect(isNoiseToken({ surface: "90" })).toBe(true);
    expect(isNoiseToken({ surface: "2027" })).toBe(true);
    expect(isNoiseToken({ surface: "1" })).toBe(true);
  });

  it("flags symbols and punctuation regardless of surface", () => {
    expect(isNoiseToken({ surface: "。", partOfSpeech: "記号" })).toBe(true);
    expect(isNoiseToken({ surface: "「", partOfSpeech: "記号" })).toBe(true);
  });

  it("does not flag real Japanese words", () => {
    expect(isNoiseToken({ surface: "食べる", partOfSpeech: "動詞" })).toBe(false);
    expect(isNoiseToken({ surface: "日本語", partOfSpeech: "名詞" })).toBe(false);
    expect(isNoiseToken({ surface: "コーヒー", partOfSpeech: "名詞" })).toBe(false);
  });

  it("does not flag mixed romaji+digit tokens (kuromoji already splits these)", () => {
    expect(isNoiseToken({ surface: "J1" })).toBe(false);
  });

  it("does not flag an empty string", () => {
    expect(isNoiseToken({ surface: "" })).toBe(false);
    expect(isNoiseToken({ surface: "   " })).toBe(false);
  });
});
