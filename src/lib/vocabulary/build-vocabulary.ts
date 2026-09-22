import type { TokenResult } from "@/lib/tokenizer/types";
import type { JLPTLevel } from "@/lib/difficulty/classify";

import { classifyDifficulty } from "../difficulty/classify";

// Un mot du vocabulaire, avec le nombre de fois qu'il apparaît dans le texte.
export type VocabularyEntry = {
  lemma: string;
  count: number;
  reading?: string;
  partOfSpeech: string;
  difficulty: JLPTLevel;
};

// Regroupe une liste de tokens par mot (forme de dictionnaire) et compte les
// occurrences de chacun, pour passer d'une liste de tokens bruts à un
// vocabulaire exploitable. Trie du mot le plus fréquent au moins fréquent.
export function buildVocabularySummary(tokens: TokenResult[]): VocabularyEntry[] {
  const map = new Map<string, VocabularyEntry>();

  for (const token of tokens) {
    const lemma = token.baseForm || token.surface;
    const existing = map.get(lemma);

    // Le mot existe déjà : on incrémente juste son compteur.
    if (existing) {
      existing.count += 1;
      continue;
    }

    // Premier passage sur ce mot : on crée son entrée dans le vocabulaire.
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
