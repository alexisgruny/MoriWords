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
