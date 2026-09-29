import type { TokenResult } from "@/lib/tokenizer/types";

import { MAX_ANALYSIS_TEXT_LENGTH, MAX_LEMMA_LENGTH, MAX_READING_LENGTH, MAX_TOKENS_PER_TEXT } from "./input-limits";

const JLPT_LEVELS = new Set(["N5", "N4", "N3", "N2", "N1", "unknown"]);

function isToken(value: unknown): value is TokenResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const token = value as Record<string, unknown>;
  return (
    typeof token.surface === "string" &&
    token.surface.length > 0 &&
    token.surface.length <= MAX_LEMMA_LENGTH &&
    typeof token.baseForm === "string" &&
    token.baseForm.length <= MAX_LEMMA_LENGTH &&
    (token.reading === undefined || token.reading === null || (typeof token.reading === "string" && token.reading.length <= MAX_READING_LENGTH)) &&
    typeof token.partOfSpeech === "string" &&
    token.partOfSpeech.length <= 30 &&
    (token.difficulty === undefined || (typeof token.difficulty === "string" && JLPT_LEVELS.has(token.difficulty))) &&
    Number.isInteger(token.position) &&
    (token.position as number) >= 0 &&
    (token.position as number) <= MAX_ANALYSIS_TEXT_LENGTH
  );
}

// Mots envoyés par le client après une analyse (/api/tokens, /api/vocabulary) :
// chaque mot doit avoir la forme attendue et la liste rester à la taille d'un
// texte analysable. null sinon (la route répond 400). Sans ce contrôle, une
// requête pouvait envoyer des centaines de milliers de « mots » à écrire en base.
export function parseTokenList(value: unknown): TokenResult[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_TOKENS_PER_TEXT) {
    return null;
  }
  return value.every(isToken) ? (value as TokenResult[]) : null;
}
