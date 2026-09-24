"use client";

import { useState } from "react";

import {
  GRAMMAR_LEVELS,
  type GrammarLevel,
  filterGrammarPoints,
  grammarPoints,
} from "@/lib/grammar/points";

// Page de référence de grammaire : points classés par niveau JLPT, avec
// filtre par niveau, recherche libre et exemples traduits.
export default function GrammarPage() {
  const [level, setLevel] = useState<GrammarLevel | "all">("N5");
  const [query, setQuery] = useState("");

  const results = filterGrammarPoints(grammarPoints, level, query);
  const countFor = (candidate: GrammarLevel) =>
    grammarPoints.filter((point) => point.level === candidate).length;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="eyebrow">MoriWords / Grammaire</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            Grammaire par niveau JLPT
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Les structures à connaître de N5 à N1, avec leur formation et des exemples
            traduits. Choisis un niveau ou cherche un motif (en japonais ou en français).
          </p>
        </header>

        <section className="panel p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Niveau JLPT">
            <button
              type="button"
              onClick={() => setLevel("all")}
              aria-pressed={level === "all"}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                level === "all"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
              }`}
            >
              Tous ({grammarPoints.length})
            </button>
            {GRAMMAR_LEVELS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setLevel(candidate)}
                aria-pressed={level === candidate}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  level === candidate
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                }`}
              >
                {candidate} ({countFor(candidate)})
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un motif ou un sens (ex. ながら, parce que)"
            aria-label="Rechercher un point de grammaire"
            className="mb-6 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
          />

          <p className="mb-4 text-sm text-[var(--muted)]">{results.length} point(s)</p>

          {results.length > 0 ? (
            <div className="grid gap-3">
              {results.map((point) => (
                <details key={point.id} className="token-card group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                    <span>
                      <span className="text-xl font-semibold text-[var(--ink)]" lang="ja">
                        {point.pattern}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">{point.meaning}</span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink)]">
                      JLPT {point.level}
                    </span>
                  </summary>

                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="eyebrow">Formation</p>
                    <p className="mt-1 text-sm text-[var(--ink)]" lang="ja">
                      {point.formation}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{point.explanation}</p>

                    <p className="eyebrow mt-4">Exemples</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {point.examples.map((example) => (
                        <li
                          key={example.ja}
                          className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2"
                        >
                          <p className="text-base text-[var(--ink)]" lang="ja">
                            {example.ja}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{example.fr}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="empty-state min-h-48">
              <p className="font-medium text-[var(--ink)]">Aucun point ne correspond.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Essaie un autre niveau ou un autre mot-clé.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
