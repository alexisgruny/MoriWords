import { JLPT_READINGS, JLPT_WORDS } from "./jlpt-vocabulary";

// Les niveaux officiels du JLPT (l'examen de japonais), du plus facile (N5)
// au plus difficile (N1) ; "unknown" quand le mot n'est pas dans le dataset.
export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1" | "unknown";

// Catégories grammaticales (étiquettes kuromoji) des mots-outils : leur niveau
// ne se devine jamais à partir d'une lecture, sinon l'auxiliaire poli ます
// hériterait du niveau de 増す (N1), qui se lit aussi « ます ».
const FUNCTION_WORD_CATEGORIES = new Set(["助動詞", "助詞", "記号", "フィラー"]);

const KANA_ONLY = /^[぀-ゟ゠-ヿー]+$/;

// Met une chaîne en minuscules et enlève les espaces pour comparer proprement.
function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// Cherche le niveau JLPT d'un mot : d'abord par sa forme de base exacte, puis
// (sauf mots-outils) par sa lecture écrite en kana comme mot du dataset
// (ex. 下さい → ください), puis, pour un mot écrit en kana, comme lecture d'un
// mot en kanji du dataset. Ne devine jamais : renvoie "unknown" sinon.
export function classifyDifficulty(
  lemma: string,
  reading?: string | null,
  partOfSpeech?: string | null,
): JLPTLevel {
  const normalizedLemma = normalize(lemma);
  const normalizedReading = normalize(reading ?? "");

  const exactMatch = JLPT_WORDS[normalizedLemma];

  if (exactMatch) {
    return exactMatch;
  }

  if (partOfSpeech && FUNCTION_WORD_CATEGORIES.has(partOfSpeech)) {
    return "unknown";
  }

  if (normalizedReading && JLPT_WORDS[normalizedReading]) {
    return JLPT_WORDS[normalizedReading];
  }

  if (KANA_ONLY.test(normalizedLemma) && JLPT_READINGS[normalizedLemma]) {
    return JLPT_READINGS[normalizedLemma];
  }

  return "unknown";
}
