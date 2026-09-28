import { describe, expect, it } from "vitest";
import { translatePartOfSpeech } from "./part-of-speech-labels";

describe("translatePartOfSpeech", () => {
  it("translates known kuromoji categories to French", () => {
    expect(translatePartOfSpeech("名詞")).toBe("nom");
    expect(translatePartOfSpeech("動詞")).toBe("verbe");
    expect(translatePartOfSpeech("助詞")).toBe("particule");
    expect(translatePartOfSpeech("記号")).toBe("symbole");
  });

  it("falls back to the raw value for an unrecognized category", () => {
    expect(translatePartOfSpeech("未知カテゴリ")).toBe("未知カテゴリ");
  });

  it("returns an empty string for a missing category", () => {
    expect(translatePartOfSpeech(null)).toBe("");
    expect(translatePartOfSpeech(undefined)).toBe("");
  });
});
