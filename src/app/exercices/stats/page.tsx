"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ExerciseSource = "grammar" | "conjugation" | "kanji" | "examples";

type SourceStats = { source: ExerciseSource; total: number; correct: number; rate: number };

type WeakPoint = {
  source: ExerciseSource;
  focus: string;
  level: string | null;
  total: number;
  correct: number;
  rate: number;
};

type ExerciseStats = { bySource: SourceStats[]; weakPoints: WeakPoint[] };

const SOURCE_LABELS: Record<ExerciseSource, string> = {
  grammar: "Grammaire",
  conjugation: "Conjugaison",
  kanji: "Kanji",
  examples: "Mon vocabulaire",
};

const EXERCISE_LINKS: Record<ExerciseSource, string> = {
  grammar: "/exercices/grammaire",
  conjugation: "/exercices/conjugaison",
  kanji: "/exercices/kanji",
  examples: "/exercices/vocabulaire",
};

function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

// Page de statistiques : taux de réussite par type d'exercice, et les
// points/formes/kanji/mots les plus ratés (au moins 2 tentatives), pour
// savoir sur quoi s'entraîner en priorité. Purement en lecture : les
// tentatives sont enregistrées côté serveur à chaque correction (voir
// logExerciseAttempt dans src/lib/grammar/exercises.ts).
export default function ExerciseStatsPage() {
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/grammar/exercises/stats");
        const data: unknown = await response.json();

        if (!response.ok) {
          throw new Error();
        }

        setStats(data as ExerciseStats);
      } catch {
        setError("Impossible de charger les statistiques.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadStats();
  }, []);

  const totalAttempts = stats?.bySource.reduce((sum, entry) => sum + entry.total, 0) ?? 0;

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm">
            <Link href="/exercices" className="link-button text-sm!">
              ← Tous les exercices
            </Link>
          </p>
          <h1 className="mt-3 text-[var(--ink)]">Mes statistiques</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Le taux de réussite par type d&apos;exercice, et ce qui mérite le plus d&apos;être revu.
          </p>
        </header>

        {isLoading ? <p className="text-sm text-[var(--muted)]">Chargement...</p> : null}

        {!isLoading && error ? <div className="empty-state">{error}</div> : null}

        {!isLoading && !error && stats && totalAttempts === 0 ? (
          <div className="empty-state">
            <p className="font-medium text-[var(--ink)]">Pas encore de tentative enregistrée.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Fais quelques exercices pour voir tes statistiques apparaître ici.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && stats && totalAttempts > 0 ? (
          <>
            <section className="panel mb-6">
              <h2 className="mb-4 text-[var(--ink)]">Par type d&apos;exercice</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.bySource
                  .filter((entry) => entry.total > 0)
                  .map((entry) => (
                    <Link key={entry.source} href={EXERCISE_LINKS[entry.source]} className="token-card block">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-[var(--ink)]">{SOURCE_LABELS[entry.source]}</span>
                        <span className="mono text-lg font-bold text-[var(--ink)]">{formatRate(entry.rate)}</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {entry.correct} / {entry.total} bonne{entry.correct > 1 ? "s" : ""} réponse
                        {entry.correct > 1 ? "s" : ""}
                      </p>
                    </Link>
                  ))}
              </div>
            </section>

            <section className="panel">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-[var(--ink)]">Points à revoir</h2>
                {stats.weakPoints.length > 0 ? (
                  <Link href="/exercices/revision" className="secondary-button">
                    S&apos;entraîner sur mes points faibles
                  </Link>
                ) : null}
              </div>

              {stats.weakPoints.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Rien à signaler pour l&apos;instant : un point apparaît ici à partir de 2 tentatives
                  et sous 80% de bonnes réponses.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {stats.weakPoints.map((point) => (
                    <li
                      key={`${point.source}-${point.focus}-${point.level ?? ""}`}
                      className="token-card flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--ink)]" lang={point.source === "kanji" ? "ja" : undefined}>
                          {point.focus}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {SOURCE_LABELS[point.source]}
                          {point.level ? ` · ${point.level}` : ""} · {point.correct} / {point.total}
                        </p>
                      </div>
                      <span className="mono shrink-0 text-lg font-bold text-[var(--accent-dark)]">
                        {formatRate(point.rate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
