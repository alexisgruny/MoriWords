import { toHiragana } from "wanakana";

import type { GameWord } from "@/lib/games/words";
import type { DeckCard } from "@/types/shared";

// Il faut assez de mots pour un memory (6 paires) et des sens variés.
export const MIN_MY_WORDS = 8;

// Sens court pour une carte de jeu : « manger ; prendre un repas » → « manger ».
export function shortMeaning(meaning: string): string {
  const first = meaning.split(/[;；/]/)[0].trim();
  return first.length > 40 ? `${first.slice(0, 39).trimEnd()}…` : first;
}

// Mots des decks de l'utilisateur jouables dans les mini-jeux : un par mot,
// seulement ceux qui ont un sens (sinon rien à deviner).
export function cardsToGameWords(cards: DeckCard[]): GameWord[] {
  const byLemma = new Map<string, GameWord>();
  for (const card of cards) {
    const meaning = card.meaning?.trim();
    if (!meaning || byLemma.has(card.lemma)) {
      continue;
    }
    byLemma.set(card.lemma, {
      written: card.lemma,
      kana: card.reading ? toHiragana(card.reading) : card.lemma,
      fr: shortMeaning(meaning),
    });
  }
  // Deux mots au même sens court rendraient une question ambiguë.
  const seenMeanings = new Set<string>();
  return [...byLemma.values()].filter((word) => {
    if (seenMeanings.has(word.fr)) return false;
    seenMeanings.add(word.fr);
    return true;
  });
}
