// Tailles maximales des textes acceptés par l'API : un texte énorme coûte
// cher à analyser et, pour la traduction, en tokens Claude.
export const MAX_ANALYSIS_TEXT_LENGTH = 10_000;
export const MAX_TRANSLATION_TEXT_LENGTH = 2_000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_LEMMA_LENGTH = 100;
export const MAX_MEANING_LENGTH = 500;

// Réponse 413 commune quand un texte dépasse sa limite.
export function tooLongResponse(label: string, max: number): Response {
  return Response.json(
    { error: `${label} est trop long (${max.toLocaleString("fr-FR")} caractères maximum).` },
    { status: 413 },
  );
}

export const MAX_DECK_NAME_LENGTH = 100;
export const MAX_DECK_DESCRIPTION_LENGTH = 500;
export const MAX_READING_LENGTH = 100;
export const MAX_SEARCH_LENGTH = 200;
// Mots d'un texte analysé : jamais plus que de caractères dans le texte.
export const MAX_TOKENS_PER_TEXT = MAX_ANALYSIS_TEXT_LENGTH;

// Liste d'identifiants envoyée par le client (exercices déjà vus, cartes à
// ignorer...) : seulement des chaînes courtes, en nombre borné. Une liste
// énorme ferait des requêtes SQL démesurées (notIn de milliers d'éléments).
export function boundedStringList(value: unknown, maxItems = 500, maxLength = 200): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string" && item.length > 0 && item.length <= maxLength)
    .slice(0, maxItems);
}

// Champ texte optionnel d'une modification : undefined si absent, null si
// vidé, sinon la chaîne ; "invalid" si ce n'est pas du texte ou s'il est trop
// long (un nombre ou un objet faisait planter la route).
export function optionalText(value: unknown, maxLength: number): string | null | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || value.length > maxLength) {
    return "invalid";
  }
  return value.trim() || null;
}
