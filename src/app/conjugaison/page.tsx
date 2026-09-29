"use client";

import Link from "next/link";
import { useState } from "react";

import { MasteryLegend, MasteryNote, masteryClass, masteryLabel, useMastery } from "@/components/mastery";
import { Chevron, NoResults, ReferenceToolbar } from "@/components/reference-toolbar";
import { conjugationForms, filterConjugationForms } from "@/lib/conjugation/forms";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";
import { jlptBadgeClass } from "@/lib/jlpt-badge";

const counts = Object.fromEntries(
  GRAMMAR_LEVELS.map((level) => [level, conjugationForms.filter((form) => form.level === level).length]),
) as Record<GrammarLevel, number>;

// Page de référence de conjugaison : formes classées par niveau JLPT, avec
// filtre par niveau, recherche libre et exemples traduits. Même structure que
// la page Grammaire (src/app/grammaire/page.tsx), sur un référentiel distinct
// (src/lib/conjugation/forms.ts). L'exercice associé vit sur sa propre
// sous-page (/exercices/conjugaison).
export default function ConjugationPage() {
  const [level, setLevel] = useState<GrammarLevel | "all">("N5");
  const [query, setQuery] = useState("");

  const results = filterConjugationForms(conjugationForms, level, query);
  const mastery = useMastery("conjugation");

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="fade-in-up mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Référence</p>
            <h1 className="text-[var(--ink)]">Conjugaison par niveau JLPT</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Les formes verbales et adjectivales à connaître de N5 à N1, avec leur
              règle de formation et des exemples traduits. Choisis un niveau ou
              cherche un mot-clé (en japonais ou en français).
            </p>
          </div>
          <Link href="/exercices/conjugaison" className="primary-button shrink-0">
            S&apos;exercer →
          </Link>
        </header>

        <section className="panel">
          <ReferenceToolbar
            level={level}
            onLevelChange={setLevel}
            counts={counts}
            total={conjugationForms.length}
            query={query}
            onQueryChange={setQuery}
            placeholder="Rechercher une forme ou un sens (ex. たい, potentielle)"
            searchLabel="Rechercher une forme de conjugaison"
          />

          <p className="mb-4 text-sm text-[var(--muted)]">
            {results.length} forme{results.length > 1 ? "s" : ""}
          </p>

          <MasteryLegend items={mastery} />

          {results.length > 0 ? (
            <div className="grid gap-3">
              {results.map((form) => (
                <details
                  key={form.id}
                  title={masteryLabel(mastery[form.name])}
                  className={`token-card group mb-0! ${masteryClass(mastery[form.name])}`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="eyebrow">
                        {form.category}
                        <MasteryNote stat={mastery[form.name]} />
                      </span>
                      <span className="mt-1 block text-lg font-semibold text-[var(--ink)]">{form.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={jlptBadgeClass(form.level)}>{form.level}</span>
                      <Chevron />
                    </span>
                  </summary>

                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="eyebrow">Formation</p>
                    <p className="mt-1 inline-block rounded-lg bg-[var(--tint)] px-3 py-1.5 text-sm text-[var(--ink)]">
                      {form.formation}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{form.explanation}</p>

                    <p className="eyebrow mt-4">Exemples</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {form.examples.map((example) => (
                        <li
                          key={`${example.base}-${example.conjugated}`}
                          className="border-l-2 border-[var(--accent)] py-1 pl-3"
                        >
                          <p className="flex flex-wrap items-baseline gap-x-2 text-base text-[var(--ink)]" lang="ja">
                            <span className="text-sm text-[var(--muted)]">{example.base}</span>
                            <span className="text-[var(--muted)]" aria-hidden="true">→</span>
                            <span className="font-semibold">{example.conjugated}</span>
                            {example.reading ? (
                              <span className="text-sm text-[var(--muted)]">({example.reading})</span>
                            ) : null}
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
            <NoResults
              title="Aucune forme ne correspond."
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
