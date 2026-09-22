// L'état de révision d'une carte : combien de fois elle a été révisée avec
// succès d'affilée, l'intervalle en jours avant la prochaine révision, sa
// "facilité" et la date à laquelle elle redeviendra due.
export type ReviewState = {
  repetitions: number;
  interval: number;
  easeFactor: number;
  dueAt: Date;
};

// Calcule le nouvel état d'une carte après une révision, selon l'algorithme
// SM-2. La note de qualité (0 à 5) dit à quel point la réponse était bonne :
// en dessous de 3, on considère que c'est raté et on recommence de zéro ;
// à partir de 3, on espace un peu plus la prochaine révision à chaque fois.
export function scheduleReview(
  state: ReviewState,
  quality: number,
): ReviewState {
  // Empêche une note en dehors de l'intervalle valide (0 à 5).
  const normalizedQuality = Math.max(0, Math.min(5, quality));

  // Réponse ratée : on repart de zéro, avec une facilité légèrement réduite
  // et une nouvelle tentative dans une minute.
  if (normalizedQuality < 3) {
    return {
      repetitions: 0,
      interval: 0,
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      dueAt: new Date(Date.now() + 60 * 1000),
    };
  }

  // Réponse réussie : on augmente la facilité et on calcule le nouvel
  // intervalle avant la prochaine révision (1 jour pour la toute première
  // fois, puis l'intervalle précédent multiplié par la facilité).
  const nextEaseFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - normalizedQuality) * (0.08)));
  const nextRepetitions = state.repetitions + 1;
  const nextInterval =
    state.repetitions === 0
      ? 1
      : Math.round(state.interval * state.easeFactor);

  return {
    repetitions: nextRepetitions,
    interval: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    dueAt: new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000),
  };
}
