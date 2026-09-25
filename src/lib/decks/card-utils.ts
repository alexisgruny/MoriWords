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

// Mélange un tableau (Fisher-Yates) sans modifier l'original.
function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// Construit les choix du mode quiz : la bonne réponse mélangée avec jusqu'à
// (optionCount - 1) leurres distincts pris dans distractorPool. Peut renvoyer
// moins de optionCount choix si le pool de leurres est insuffisant (jamais
// de doublon ni de leurre identique à la bonne réponse).
export function buildQuizChoices(
  correctMeaning: string,
  distractorPool: string[],
  optionCount = 4,
): string[] {
  const uniqueDistractors = Array.from(
    new Set(distractorPool.filter((meaning) => meaning !== correctMeaning)),
  );
  const chosenDistractors = shuffle(uniqueDistractors).slice(0, optionCount - 1);

  return shuffle([correctMeaning, ...chosenDistractors]);
}

// Où en est une carte dans l'apprentissage : jamais révisée, en cours, ou
// "maîtrisée" (intervalle de révision d'au moins 3 semaines).
export type CardStatus = "new" | "learning" | "mature";

export const MATURE_INTERVAL_DAYS = 21;

export function getCardStatus(card: {
  repetitions?: number | null;
  interval?: number | null;
  _count?: { reviewLogs: number };
}): CardStatus {
  // Une carte ratée voit ses répétitions remises à 0 : le nombre de révisions
  // enregistrées est plus fiable que les répétitions pour savoir si elle a déjà été vue.
  const hasBeenReviewed = card._count ? card._count.reviewLogs > 0 : Boolean(card.repetitions);

  if (!hasBeenReviewed) {
    return "new";
  }

  return card.repetitions && (card.interval ?? 0) >= MATURE_INTERVAL_DAYS ? "mature" : "learning";
}

// Les mots qui posent le plus de problèmes : cartes déjà révisées dont le
// facteur de facilité SM-2 est le plus bas (il baisse à chaque mauvaise
// réponse), du plus difficile au moins difficile.
export function pickHardestCards<T extends { repetitions?: number | null; easeFactor?: number | null; _count?: { reviewLogs: number } }>(
  cards: T[],
  limit: number,
): T[] {
  return cards
    .filter((card) => (card._count?.reviewLogs ?? 0) > 0 && typeof card.easeFactor === "number")
    .sort((a, b) => (a.easeFactor as number) - (b.easeFactor as number))
    .slice(0, limit);
}
