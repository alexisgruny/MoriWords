"use client";

import { useEffect, useState } from "react";

import { FilterChips } from "@/components/reference-toolbar";
import { authClient } from "@/lib/auth/auth-client";
import { MIN_MY_WORDS, cardsToGameWords } from "@/lib/games/my-words";
import { GAME_WORDS, GAME_WORDS_N4, type GameWord } from "@/lib/games/words";
import type { DeckSummary } from "@/types/shared";

export type WordSource = "n5" | "n4" | "mine";

// Mots des decks du compte connecté (null tant qu'ils ne sont pas chargés,
// ou sans compte).
function useMyWords(): GameWord[] | null {
  const { data: session } = authClient.useSession();
  const [words, setWords] = useState<GameWord[] | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      return;
    }
    let isCancelled = false;
    void fetch("/api/decks")
      .then((response) => (response.ok ? (response.json() as Promise<{ decks?: DeckSummary[] }>) : null))
      .then((data) => {
        if (!isCancelled && data?.decks) setWords(cardsToGameWords(data.decks.flatMap((deck) => deck.cards)));
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return userId ? words : null;
}

// Choix des mots d'une partie : mots N5 ou N4 du jeu, ou « Mes mots » (ceux
// de ses decks) dès qu'il y en a assez. Réviser en jouant, sans Claude.
export function useWordSource() {
  const myWords = useMyWords();
  const [source, setSource] = useState<WordSource>("n5");
  const canUseMine = myWords !== null && myWords.length >= MIN_MY_WORDS;
  const words = source === "mine" && canUseMine ? myWords : source === "n4" ? GAME_WORDS_N4 : GAME_WORDS;

  const picker = (
    <FilterChips
      options={[
        { value: "n5" as const, label: "Mots N5" },
        { value: "n4" as const, label: "Mots N4" },
        ...(canUseMine ? [{ value: "mine" as const, label: "Mes mots", count: myWords.length }] : []),
      ]}
      value={source}
      onChange={setSource}
      label="Mots de la partie"
    />
  );

  return { words, picker };
}
