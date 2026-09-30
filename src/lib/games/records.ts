"use client";

import { useCallback, useSyncExternalStore } from "react";

import { shuffle } from "@/lib/shuffle";
import { GAME_WORDS, type GameWord } from "@/lib/games/words";

export type GameId = "memory" | "chrono" | "particules" | "shiritori" | "mots-croises";

// Records gardés dans le navigateur : les jeux marchent sans compte et un
// record perdu n'est pas grave. Tout accès au stockage peut échouer
// (navigation privée, stockage bloqué), d'où les try/catch.
const STORAGE_KEY = "moriwords-jeux-records";

const CHANGE_EVENT = "moriwords-jeux-records";

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Partial<Record<GameId, number>> {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Partial<Record<GameId, number>>) : {};
  } catch {
    return {};
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// lowerIsBetter : pour le memory, moins de coups = meilleur.
export function useRecord(game: GameId, lowerIsBetter = false) {
  // Rien côté serveur : le record n'apparaît qu'une fois dans le navigateur.
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const stored = parse(raw)[game];
  const record = typeof stored === "number" ? stored : null;

  // Renvoie true si le score bat le record (relu dans le stockage : fonction
  // stable, utilisable dans les effets).
  const submit = useCallback((score: number): boolean => {
    const all = parse(readRaw());
    const previous = all[game] ?? null;
    const isBetter = previous === null || (lowerIsBetter ? score < previous : score > previous);
    if (!isBetter) {
      return false;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [game]: score }));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Stockage indisponible : le record ne vaut que pour cette partie.
    }
    return true;
  }, [game, lowerIsBetter]);

  return { record, submit };
}

export function pickWords(count: number, exclude: GameWord[] = []): GameWord[] {
  return shuffle(GAME_WORDS.filter((word) => !exclude.includes(word))).slice(0, count);
}

// Sens proposés pour un mot : le bon et trois autres au hasard.
export function meaningChoices(word: GameWord): string[] {
  const others = shuffle(GAME_WORDS.filter((other) => other.fr !== word.fr)).slice(0, 3);
  return shuffle([word.fr, ...others.map((other) => other.fr)]);
}
