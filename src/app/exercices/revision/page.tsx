"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TranslationExercise, type Source } from "@/components/translation-exercise";

type WeakPoint = { source: Source; focus: string; level: string | null; total: number; correct: number; rate: number };

type ExerciseStats = { weakPoints: WeakPoint[] };

const SOURCE_LABELS: Record<Source, string> = {
  grammar: "Grammaire",
  conjugation: "Conjugaison",
  kanji: "Kanji (sens)",
  "kanji-reading": "Kanji (lecture)",
  examples: "Mon vocabulaire",
};

// Regroupe les points faibles par source, en ne gardant qu'une fois chaque
// focus (un même point peut apparaître plusieurs fois si son niveau variait,
// ce qui n'arrive pas en pratique mais coûte rien à couvrir).
function groupBySource(weakPoints: WeakPoint[]): Partial<Record<Source, string[]>> {
  const grouped: Partial<Record<Source, Set<string>>> = {};

  for (const point of weakPoints) {
    const set = grouped[point.source] ?? new Set<string>();
    set.add(point.focus);
    grouped[point.source] = set;
  }

  return Object.fromEntries(
    Object.entries(grouped).map(([source, focuses]) => [source, Array.from(focuses!)]),
  ) as Partial<Record<Source, string[]>>;
}

// Session d'entraînement ciblée : reprend le même composant que les
// sous-pages /exercices/<type>, mais avec focusIn restreint aux points
// faibles de /exercices/stats (au moins 2 tentatives, moins de 80% de
// réussite). Une section par source concernée, puisqu'un point faible peut
// venir de plusieurs types d'exercice à la fois.
export default function RevisionPage() {
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
        setError("Impossible de charger tes points faibles.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadStats();
  }, []);

  const bySource = stats ? groupBySource(stats.weakPoints) : {};
  // Les kana ont leur propre quiz (/exercices/kana) : pas de section ici.
  const sourcesWithWeakPoints = (Object.keys(bySource) as Source[]).filter(
    (source) => source in SOURCE_LABELS && bySource[source]!.length > 0,
  );

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm">
            <Link href="/exercices/stats" className="link-button text-sm!">
              ← Mes statistiques
            </Link>
          </p>
          <h1 className="mt-3 text-[var(--ink)]">Révision des points faibles</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Les exercices ci-dessous ne piochent que dans les points où tu as le plus de mal.
          </p>
        </header>

        {isLoading ? <div className="skeleton h-40" /> : null}

        {!isLoading && error ? <div className="empty-state">{error}</div> : null}

        {!isLoading && !error && sourcesWithWeakPoints.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <p className="font-medium text-[var(--ink)]">Rien à revoir pour l&apos;instant.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Continue à t&apos;entraîner sur{" "}
              <Link href="/exercices" className="link-button text-sm!">
                les exercices
              </Link>{" "}
              : un point apparaîtra ici s&apos;il te pose problème.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-6">
          {sourcesWithWeakPoints.map((source) => (
            <div key={source}>
              <p className="eyebrow mb-2">{SOURCE_LABELS[source]}</p>
              <TranslationExercise source={source} focusIn={bySource[source]} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
