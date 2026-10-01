import { toHiragana } from "wanakana";

import { GAME_WORDS, GAME_WORDS_N4, type GameWord } from "@/lib/games/words";

// Mots N5 et N4 : plus de mots, donc plus d'enchaînements possibles (avec
// les seuls mots N5, beaucoup de kana n'avaient aucune suite).
export const SHIRITORI_WORDS: GameWord[] = [...GAME_WORDS, ...GAME_WORDS_N4];

const SMALL_TO_BIG: Record<string, string> = {
  ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ",
};

// Kana par lequel le mot suivant doit commencer : le dernier, en ignorant le
// trait d'allongement (コーヒー → ひ) et en agrandissant les petits kana
// (でんしゃ → や), comme dans le vrai shiritori.
export function lastKana(kana: string): string {
  // ー retiré avant toHiragana, qui le changerait en voyelle (コーヒー → こおひい).
  const letters = [...toHiragana(kana.replaceAll("ー", ""))];
  const last = letters.at(-1) ?? "";
  return SMALL_TO_BIG[last] ?? last;
}

export function firstKana(kana: string): string {
  return [...toHiragana(kana)][0] ?? "";
}

export function endsWithN(kana: string): boolean {
  return lastKana(kana) === "ん";
}

export function findWord(kana: string): GameWord | undefined {
  const wanted = toHiragana(kana.trim());
  return SHIRITORI_WORDS.find((word) => toHiragana(word.kana) === wanted);
}

// Mots encore jouables après `previous` (non utilisés, bonne première lettre).
export function playableWords(previous: string, used: Set<string>): GameWord[] {
  const start = lastKana(previous);
  return SHIRITORI_WORDS.filter((word) => !used.has(toHiragana(word.kana)) && firstKana(word.kana) === start);
}

// Coup de l'ordinateur : évite les mots en ん (qui font perdre) tant qu'il peut.
export function computerMove(previous: string, used: Set<string>, pick: (words: GameWord[]) => GameWord): GameWord | null {
  const options = playableWords(previous, used);
  if (options.length === 0) {
    return null;
  }
  const safe = options.filter((word) => !endsWithN(word.kana));
  return pick(safe.length > 0 ? safe : options);
}

export type PlayerMoveResult =
  | { ok: true; word: GameWord }
  | { ok: false; reason: "inconnu" | "lettre" | "deja" };

export function checkPlayerMove(input: string, previous: string, used: Set<string>): PlayerMoveResult {
  const word = findWord(input);
  if (!word) {
    return { ok: false, reason: "inconnu" };
  }
  if (firstKana(word.kana) !== lastKana(previous)) {
    return { ok: false, reason: "lettre" };
  }
  if (used.has(toHiragana(word.kana))) {
    return { ok: false, reason: "deja" };
  }
  return { ok: true, word };
}
