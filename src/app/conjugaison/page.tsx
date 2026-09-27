"use client";

import { useState } from "react";

import { conjugationForms, filterConjugationForms } from "@/lib/conjugation/forms";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";

// Page de référence de conjugaison : formes classées par niveau JLPT, avec
// filtre par niveau, recherche libre et exemples traduits. Même structure que
// la page Grammaire (src/app/grammaire/page.tsx), sur un référentiel distinct
// (src/lib/conjugation/forms.ts).
export default function ConjugationPage() {
  const [level, setLevel] = useState<GrammarLevel | "all">("N5");
  const [query, setQuery] = useState("");

  const results = filterConjugationForms(conjugationForms, level, query);
  const countFor = (candidate: GrammarLevel) =>
    conjugationForms.filter((form) => form.level === candidate).length;

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-[var(--ink)]">Conjugaison par niveau JLPT</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Les formes verbales et adjectivales à connaître de N5 à N1, avec leur
            règle de formation et des exemples traduits. Choisis un niveau ou
            cherche un mot-clé (en japonais ou en français).
          </p>
        </header>

        <section className="panel">
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Niveau JLPT">
            <button
              type="button"
              onClick={() => setLevel("all")}
              aria-pressed={level === "all"}
              className={`rounded-sm border px-3.5 py-1.5 text-sm font-medium transition ${
                level === "all"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                  : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
              }`}
            >
              Tous ({conjugationForms.length})
            </button>
            {GRAMMAR_LEVELS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setLevel(candidate)}
                aria-pressed={level === candidate}
                className={`rounded-sm border px-3.5 py-1.5 text-sm font-medium transition ${
                  level === candidate
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                    : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
                }`}
              >
                {candidate} ({countFor(candidate)})
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une forme ou un sens (ex. たい, potentielle)"
            aria-label="Rechercher une forme de conjugaison"
            className="mb-6 min-h-11 w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
          />

          <p className="mb-4 text-sm text-[var(--muted)]">{results.length} forme(s)</p>

          {results.length > 0 ? (
            <div className="grid gap-3">
              {results.map((form) => (
                <details key={form.id} className="token-card group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                    <span>
                      <span className="eyebrow">{form.category}</span>
                      <span className="mt-1 block text-lg font-semibold text-[var(--ink)]">
                        {form.name}
                      </span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap rounded-sm border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 mono text-xs text-[var(--ink)]">
                      JLPT {form.level}
                    </span>
                  </summary>

                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="eyebrow">Formation</p>
                    <p className="mt-1 text-sm text-[var(--ink)]">{form.formation}</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{form.explanation}</p>

                    <p className="eyebrow mt-4">Exemples</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {form.examples.map((example) => (
                        <li
                          key={`${example.base}-${example.conjugated}`}
                          className="border-l-2 border-[var(--line)] py-1 pl-3"
                        >
                          <p className="text-base text-[var(--ink)]" lang="ja">
                            {example.conjugated}
                            <span className="ml-2 text-sm text-[var(--muted)]">
                              ({example.base}
                              {example.reading ? ` · ${example.reading}` : ""})
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{example.meaning}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="empty-state min-h-48">
              <p className="font-medium text-[var(--ink)]">Aucune forme ne correspond.</p>
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
