import type { GameId } from "@/lib/games/records";

export type GameInfo = { id: GameId; title: string; summary: string; icon: string; skill: string };

// Les mini-jeux : tout se joue dans le navigateur, sans compte ni appel à Claude.
export const GAMES: GameInfo[] = [
  { id: "memory", title: "Memory", icon: "🃏", skill: "Vocabulaire", summary: "Retrouve les paires mot japonais ↔ sens français." },
  { id: "chrono", title: "Contre la montre", icon: "⏱", skill: "Vocabulaire", summary: "Un maximum de bons sens en 60 secondes." },
  { id: "particules", title: "Particules à trous", icon: "🧩", skill: "Grammaire", summary: "Choisis la bonne particule : は, を, に, で…" },
  { id: "shiritori", title: "Shiritori", icon: "🔗", skill: "Vocabulaire et kana", summary: "Enchaîne les mots contre l'ordinateur, sans finir par ん." },
  { id: "mots-croises", title: "Mots croisés", icon: "✏️", skill: "Écriture en kana", summary: "Une petite grille en hiragana, avec le sens français comme indice." },
];

export function findGame(id: string): GameInfo | undefined {
  return GAMES.find((game) => game.id === id);
}
