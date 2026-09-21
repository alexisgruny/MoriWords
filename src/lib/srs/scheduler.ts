export type ReviewState = {
  repetitions: number;
  interval: number;
  easeFactor: number;
  dueAt: Date;
};

export function scheduleReview(
  state: ReviewState,
  quality: number,
): ReviewState {
  const normalizedQuality = Math.max(0, Math.min(5, quality));

  if (normalizedQuality < 3) {
    return {
      repetitions: 0,
      interval: 0,
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      dueAt: new Date(Date.now() + 60 * 1000),
    };
  }

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
