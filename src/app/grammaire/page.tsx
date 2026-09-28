"use client";

import Link from "next/link";
import { useState } from "react";

import { Chevron, NoResults, ReferenceToolbar } from "@/components/reference-toolbar";
import {
  GRAMMAR_LEVELS,
  type GrammarLevel,
  filterGrammarPoints,
  grammarPoints,
} from "@/lib/grammar/points";
import { jlptBadgeClass } from "@/lib/jlpt-badge";

const counts = Object.fromEntries(
  GRAMMAR_LEVELS.map((level) => [level, grammarPoints.filter((point) => point.level === level).length]),
) as Record<GrammarLevel, number>;

// Page de référence de grammaire : points classés par niveau JLPT, avec
// filtre par niveau, recherche libre et exemples traduits. L'exercice de
// traduction associé vit sur sa propre sous-page (/exercices/grammaire).
export default function GrammarPage() {
  const [level, setLevel] = useState<GrammarLevel | "all">("N5");
  const [query, setQuery] = useState("");

  const results = filterGrammarPoints(grammarPoints, level, query);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="fade-in-up mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Référence</p>
            <h1 className="text-[var(--ink)]">Grammaire par niveau JLPT</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Les structures à connaître de N5 à N1, avec leur formation et des exemples
              traduits. Choisis un niveau ou cherche un motif (en japonais ou en français).
            </p>
          </div>
          <Link href="/exercices/grammaire" className="primary-button shrink-0">
            S&apos;exercer →
          </Link>
        </header>

        <section className="panel">
          <ReferenceToolbar
            level={level}
            onLevelChange={setLevel}
            counts={counts}
            total={grammarPoints.length}
            query={query}
            onQueryChange={setQuery}
            placeholder="Rechercher un motif ou un sens (ex. ながら, parce que)"
            searchLabel="Rechercher un point de grammaire"
          />

          <p className="mb-4 text-sm text-[var(--muted)]">
            {results.length} point{results.length > 1 ? "s" : ""}
          </p>

          {results.length > 0 ? (
            <div className="grid gap-3">
              {results.map((point) => (
                <details key={point.id} className="token-card group mb-0!">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="text-xl font-semibold text-[var(--ink)]" lang="ja">
                        {point.pattern}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">{point.meaning}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={jlptBadgeClass(point.level)}>{point.level}</span>
                      <Chevron />
                    </span>
                  </summary>

                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="eyebrow">Formation</p>
                    <p className="mt-1 inline-block rounded-lg bg-[var(--tint)] px-3 py-1.5 text-sm text-[var(--ink)]" lang="ja">
                      {point.formation}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{point.explanation}</p>

                    <p className="eyebrow mt-4">Exemples</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {point.examples.map((example) => (
                        <li key={example.ja} className="border-l-2 border-[var(--accent)] py-1 pl-3">
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
            <NoResults
              title="Aucun point ne correspond."
              onReset={() => {
                setLevel("all");
                setQuery("");
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
