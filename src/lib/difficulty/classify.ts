import { JLPT_VOCABULARY } from "./jlpt-vocabulary";

// Les niveaux officiels du JLPT (l'examen de japonais), du plus facile (N5)
// au plus difficile (N1) ; "unknown" quand le mot n'est pas dans le dataset.
export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1" | "unknown";

// Met une chaîne en minuscules et enlève les espaces pour comparer proprement.
function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// Cherche le niveau JLPT d'un mot d'abord par sa forme de base, puis par sa
// lecture si la forme de base n'est pas trouvée. Ne devine jamais : renvoie
// "unknown" si le mot est absent du dataset.
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
