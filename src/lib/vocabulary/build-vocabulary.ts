import type { TokenResult } from "@/lib/tokenizer/types";
import type { JLPTLevel } from "@/lib/difficulty/classify";

import { classifyDifficulty } from "../difficulty/classify";

export type VocabularyEntry = {
  lemma: string;
  count: number;
  reading?: string;
  partOfSpeech: string;
  difficulty: JLPTLevel;
};

export function buildVocabularySummary(tokens: TokenResult[]): VocabularyEntry[] {
  const map = new Map<string, VocabularyEntry>();

  for (const token of tokens) {
    const lemma = token.baseForm || token.surface;
    const existing = map.get(lemma);

    if (existing) {
      existing.count += 1;
      continue;
    }

    map.set(lemma, {
      lemma,
      count: 1,
      reading: token.reading,
      partOfSpeech: token.partOfSpeech,
      difficulty: classifyDifficulty(lemma, token.reading, token.partOfSpeech),
    });
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
