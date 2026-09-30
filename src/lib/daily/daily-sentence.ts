import { type GrammarLevel, grammarPoints } from "@/lib/grammar/points";

export type DailySentence = { ja: string; fr: string; pattern: string; level: GrammarLevel };

// Numéro du jour (calendrier local de l'utilisateur) : la phrase change à
// minuit chez lui, pas à minuit UTC.
export function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

// Phrase du jour : un exemple de grammaire du niveau choisi (écrit et traduit
// à la main, donc gratuit, sans Claude), le même pour tout le monde ce
// jour-là. Le pas de 7 évite deux jours de suite sur le même point.
export function dailySentence(level: GrammarLevel, date: Date): DailySentence {
  const pool = grammarPoints
    .filter((point) => point.level === level)
    .flatMap((point) => point.examples.map((example) => ({ ...example, pattern: point.pattern, level })));
  const index = (dayNumber(date) * 7) % pool.length;
  return pool[index];
}
