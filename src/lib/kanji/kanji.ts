// Référentiel de kanji classé par niveau JLPT, construit à partir des données
// générées (src/lib/kanji/jlpt-kanji-data.ts). Même forme d'usage que
// src/lib/grammar/points.ts et src/lib/conjugation/forms.ts (filtre par
// niveau + texte libre), sur un jeu de données bien plus grand (~2200 kanji).
import { type GrammarLevel } from "@/lib/grammar/points";

import { KANJI_DATA } from "./jlpt-kanji-data";

export type KanjiEntry = {
  kanji: string;
  level: GrammarLevel;
  onReadings: string[];
  kunReadings: string[];
  meaning: string;
  strokeCount: number;
};

// Triés par niveau (N5 en premier) puis par ordre du dataset source, pour un
// affichage stable.
const LEVEL_ORDER: GrammarLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export const JLPT_KANJI: KanjiEntry[] = Object.entries(KANJI_DATA)
  .map(([kanji, entry]) => ({
    kanji,
    level: entry.level,
    onReadings: entry.on,
    kunReadings: entry.kun,
    meaning: entry.meaning,
    strokeCount: entry.strokes,
  }))
  .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

// Filtre les kanji par niveau JLPT (ou tous) et par texte libre, cherché dans
// le kanji lui-même, ses lectures et son sens (sans accents ni casse).
export function filterKanji(entries: KanjiEntry[], level: GrammarLevel | "all", query: string): KanjiEntry[] {
  // Le "." dans les lectures kun marque la limite des okurigana (ex. "た.べる")
  // dans le dataset source : on le retire pour chercher "たべる" naturellement.
  const normalize = (value: string) =>
    value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\./g, "").toLowerCase();
  const normalizedQuery = normalize(query.trim());

  return entries.filter((entry) => {
    if (level !== "all" && entry.level !== level) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    if (entry.kanji === query.trim()) {
      return true;
    }

    return [...entry.onReadings, ...entry.kunReadings, entry.meaning].some((field) =>
      normalize(field).includes(normalizedQuery),
    );
  });
}
