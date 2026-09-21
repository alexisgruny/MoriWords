import { describe, expect, it } from "vitest";

import type { TokenResult } from "@/lib/tokenizer/types";
import { buildVocabularySummary } from "./build-vocabulary";

describe("buildVocabularySummary", () => {
  it("regroupe les tokens par lemme et compte les occurrences", () => {
    const tokens: TokenResult[] = [
      {
        surface: "私は",
        baseForm: "私",
        reading: "わたし",
        partOfSpeech: "代名詞",
        difficulty: "N5",
        position: 0,
      },
      {
        surface: "私",
        baseForm: "私",
        reading: "わたし",
        partOfSpeech: "代名詞",
        difficulty: "N5",
        position: 1,
      },
      {
        surface: "勉強します",
        baseForm: "勉強する",
        reading: "べんきょうします",
        partOfSpeech: "動詞",
        difficulty: "N4",
        position: 2,
      },
    ];

    expect(buildVocabularySummary(tokens)).toEqual([
      {
        lemma: "私",
        count: 2,
        reading: "わたし",
        partOfSpeech: "代名詞",
        difficulty: "N5",
      },
      {
        lemma: "勉強する",
        count: 1,
        reading: "べんきょうします",
        partOfSpeech: "動詞",
        difficulty: "unknown",
      },
    ]);
  });
});
