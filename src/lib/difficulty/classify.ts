import { JLPT_VOCABULARY } from "./jlpt-vocabulary";

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1" | "unknown";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function classifyDifficulty(
  lemma: string,
  reading?: string | null,
  partOfSpeech?: string | null,
): JLPTLevel {
  const normalizedLemma = normalize(lemma);
  const normalizedReading = normalize(reading ?? "");

  return JLPT_VOCABULARY[normalizedLemma]
    ?? JLPT_VOCABULARY[normalizedReading]
    ?? "unknown";
}
