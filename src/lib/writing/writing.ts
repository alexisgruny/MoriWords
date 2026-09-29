import { KANA, type KanaEntry } from "@/lib/kana/kana";

// Tracés servis par le site (public/strokes, voir
// scripts/generate-stroke-data.mjs), nommés par code point hexadécimal.
export function strokeDataUrl(character: string): string {
  return `/strokes/${character.codePointAt(0)!.toString(16)}.json`;
}

// Un caractère est « réussi » avec au plus une erreur de trait, sans avoir
// affiché le modèle ni l'animation (sinon c'est du recopiage : entraînement,
// non compté dans les statistiques).
export const MAX_MISTAKES_FOR_SUCCESS = 1;

export type WritingResult = { mistakes: number; assisted: boolean };

export function isWritingSuccess(result: WritingResult): boolean {
  return !result.assisted && result.mistakes <= MAX_MISTAKES_FOR_SUCCESS;
}

// Kana à écrire : un seul caractère (les combinés comme きゃ s'écrivent avec
// deux kana déjà travaillés séparément).
export const WRITABLE_KANA: KanaEntry[] = KANA.filter((entry) => [...entry.kana].length === 1);
