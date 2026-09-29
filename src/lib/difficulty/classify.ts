import { JLPT_READINGS, JLPT_WORDS, type JlptVocabularyLevel } from "./jlpt-vocabulary";

// Les niveaux officiels du JLPT (l'examen de japonais), du plus facile (N5)
// au plus difficile (N1) ; "unknown" quand le mot n'est pas dans le dataset.
export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1" | "unknown";

// Catégories grammaticales (étiquettes kuromoji) des mots-outils : leur niveau
// ne se devine jamais à partir d'une lecture, sinon l'auxiliaire poli ます
// hériterait du niveau de 増す (N1), qui se lit aussi « ます ».
const FUNCTION_WORD_CATEGORIES = new Set(["助動詞", "助詞", "記号", "フィラー"]);

const KANA_ONLY = /^[぀-ゟ゠-ヿー]+$/;

const LEVEL_RANK: Record<JlptVocabularyLevel, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };

// Forme écrite -> niveau, avec les entrées groupées de la source dépliées
// (「いい; よい」, 「回る、回す」) ; un mot listé à plusieurs niveaux (les deux
// sources se recoupent) garde le plus facile : いい est N5, pas N4.
export const WORD_LEVELS: Record<string, JlptVocabularyLevel> = {};
for (const [key, level] of Object.entries(JLPT_WORDS)) {
  for (const word of key.split(/[;；、]/).map((part) => part.trim()).filter(Boolean)) {
    const current = WORD_LEVELS[word];
    if (!current || LEVEL_RANK[level] < LEVEL_RANK[current]) {
      WORD_LEVELS[word] = level;
    }
  }
}

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

  const exactMatch = WORD_LEVELS[normalizedLemma];

  if (exactMatch) {
    return exactMatch;
  }

  if (partOfSpeech && FUNCTION_WORD_CATEGORIES.has(partOfSpeech)) {
    return "unknown";
  }

  if (normalizedReading && WORD_LEVELS[normalizedReading]) {
    return WORD_LEVELS[normalizedReading];
  }

  if (KANA_ONLY.test(normalizedLemma) && JLPT_READINGS[normalizedLemma]) {
    return JLPT_READINGS[normalizedLemma];
  }

  return "unknown";
}
