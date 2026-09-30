import { describe, expect, it } from "vitest";

import { cardsToGameWords, shortMeaning } from "./my-words";

describe("mots des decks pour les mini-jeux", () => {
  it("keeps one word per lemma, only with a meaning, reading in hiragana", () => {
    const words = cardsToGameWords([
      { id: "1", lemma: "猫", reading: "ネコ", meaning: "chat" },
      { id: "2", lemma: "猫", reading: "ねこ", meaning: "chat (autre deck)" },
      { id: "3", lemma: "犬", reading: "いぬ", meaning: null },
      { id: "4", lemma: "テレビ", reading: null, meaning: "télévision" },
    ]);
    expect(words).toEqual([
      { written: "猫", kana: "ねこ", fr: "chat" },
      { written: "テレビ", kana: "テレビ", fr: "télévision" },
    ]);
  });

  it("shortens long meanings and drops words whose short meaning repeats", () => {
    expect(shortMeaning("manger ; prendre un repas")).toBe("manger");
    expect(shortMeaning("x".repeat(60))).toHaveLength(40);
    const words = cardsToGameWords([
      { id: "1", lemma: "食べる", reading: "たべる", meaning: "manger ; se nourrir" },
      { id: "2", lemma: "召し上がる", reading: "めしあがる", meaning: "manger / honorifique" },
    ]);
    expect(words.map((word) => word.written)).toEqual(["食べる"]);
  });
});
