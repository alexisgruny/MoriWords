import { prisma } from "@/lib/db/prisma";

import type { ExerciseSource } from "./exercises";

// Sous ce seuil de tentatives, un taux de réussite est trop peu fiable pour
// être signalé comme un point faible (une seule mauvaise réponse ne veut pas
// dire grand-chose). Au-delà de ce taux, le point est considéré comme acquis
// et ne mérite pas d'être mis en avant même s'il fait partie des moins bons.
const MIN_ATTEMPTS_FOR_WEAK_POINT = 2;
const MAX_RATE_FOR_WEAK_POINT = 0.8;
const MAX_WEAK_POINTS = 10;

export type SourceStats = { source: ExerciseSource; total: number; correct: number; rate: number };

export type WeakPoint = {
  source: ExerciseSource;
  focus: string;
  level: string | null;
  total: number;
  correct: number;
  rate: number;
};

export type ExerciseStats = { bySource: SourceStats[]; weakPoints: WeakPoint[] };

const ALL_SOURCES: ExerciseSource[] = ["grammar", "conjugation", "kanji", "examples"];

// Additionne deux comptages groupés (total toutes réponses, puis bonnes
// réponses seulement) en un seul totalCorrect par clé de groupe.
function mergeCounts<K extends string>(
  totals: Array<{ key: K; count: number }>,
  corrects: Array<{ key: K; count: number }>,
): Map<K, { total: number; correct: number }> {
  const merged = new Map<K, { total: number; correct: number }>();

  for (const entry of totals) {
    merged.set(entry.key, { total: entry.count, correct: 0 });
  }

  for (const entry of corrects) {
    const existing = merged.get(entry.key);
    if (existing) {
      existing.correct = entry.count;
    }
  }

  return merged;
}

// Calcule le taux de réussite par source (grammaire/conjugaison/kanji/mon
// vocabulaire) et repère les points/formes/kanji/mots les plus ratés (au
// moins MIN_ATTEMPTS_FOR_WEAK_POINT tentatives), pour la page
// /exercices/stats. Deux requêtes groupées (total, puis correct=true)
// plutôt qu'un comptage conditionnel : plus simple et portable que du SQL
// brut, et le volume de tentatives d'un usage personnel reste petit.
export async function getExerciseStats(userId: string): Promise<ExerciseStats> {
  const [totalsBySource, correctsBySource, totalsByFocus, correctsByFocus] = await Promise.all([
    prisma.exerciseAttempt.groupBy({ by: ["source"], where: { userId }, _count: { _all: true } }),
    prisma.exerciseAttempt.groupBy({ by: ["source"], where: { userId, correct: true }, _count: { _all: true } }),
    prisma.exerciseAttempt.groupBy({ by: ["source", "focus", "level"], where: { userId }, _count: { _all: true } }),
    prisma.exerciseAttempt.groupBy({
      by: ["source", "focus", "level"],
      where: { userId, correct: true },
      _count: { _all: true },
    }),
  ]);

  const sourceCounts = mergeCounts(
    totalsBySource.map((row) => ({ key: row.source as ExerciseSource, count: row._count._all })),
    correctsBySource.map((row) => ({ key: row.source as ExerciseSource, count: row._count._all })),
  );

  const bySource: SourceStats[] = ALL_SOURCES.map((source) => {
    const counts = sourceCounts.get(source) ?? { total: 0, correct: 0 };
    return {
      source,
      total: counts.total,
      correct: counts.correct,
      rate: counts.total > 0 ? counts.correct / counts.total : 0,
    };
  });

  const focusKey = (source: string, focus: string, level: string | null) => `${source}\u0000${focus}\u0000${level ?? ""}`;
  const focusCounts = mergeCounts(
    totalsByFocus.map((row) => ({ key: focusKey(row.source, row.focus, row.level), count: row._count._all })),
    correctsByFocus.map((row) => ({ key: focusKey(row.source, row.focus, row.level), count: row._count._all })),
  );
  const focusDetails = new Map(totalsByFocus.map((row) => [focusKey(row.source, row.focus, row.level), row]));

  const weakPoints: WeakPoint[] = Array.from(focusCounts.entries())
    .map(([key, counts]) => {
      const details = focusDetails.get(key)!;
      return {
        source: details.source as ExerciseSource,
        focus: details.focus,
        level: details.level,
        total: counts.total,
        correct: counts.correct,
        rate: counts.total > 0 ? counts.correct / counts.total : 0,
      };
    })
    .filter((entry) => entry.total >= MIN_ATTEMPTS_FOR_WEAK_POINT && entry.rate < MAX_RATE_FOR_WEAK_POINT)
    .sort((a, b) => a.rate - b.rate || b.total - a.total)
    .slice(0, MAX_WEAK_POINTS);

  return { bySource, weakPoints };
}
