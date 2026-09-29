import { describe, expect, it } from "vitest";

import { normalizeAnswerKey } from "./exercises";

describe("normalizeAnswerKey", () => {
  it("ignores width, spaces, punctuation and quotes so the cached correction is reused", () => {
    const variants = ["はい、そうです。", "はいそうです", " はい そうです！", "「はい、そうです」", "はい，そうです．"];
    expect(new Set(variants.map(normalizeAnswerKey))).toEqual(new Set(["はいそうです"]));
    expect(normalizeAnswerKey("ｺｰﾋｰ")).toBe(normalizeAnswerKey("コーヒー"));
  });

  it("keeps what can change the verdict (kana vs kanji, particles)", () => {
    expect(normalizeAnswerKey("わたしは")).not.toBe(normalizeAnswerKey("私は"));
    expect(normalizeAnswerKey("私が")).not.toBe(normalizeAnswerKey("私は"));
  });
});
