// Mélange un tableau (Fisher-Yates) sans modifier l'original. Partagé par le
// quiz de révision (leurres) et le tirage des exercices de grammaire.
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
