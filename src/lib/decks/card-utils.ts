// Forme brute d'une carte telle qu'elle arrive depuis le client, avant nettoyage.
export type CardPayload = {
  lemma: string;
  surface?: string | null;
  reading?: string | null;
  meaning?: string | null;
};

// Nettoie les champs d'une carte : enlève les espaces inutiles et transforme
// les chaînes vides en null pour garder la base de données propre.
export function normalizeCardPayload(input: CardPayload) {
  const lemma = input.lemma.trim();

  return {
    lemma,
    surface: normalizeNullable(input.surface),
    reading: normalizeNullable(input.reading),
    meaning: normalizeNullable(input.meaning),
  };
}

// Transforme une valeur optionnelle en chaîne nettoyée, ou en null si elle est vide.
function normalizeNullable(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}
