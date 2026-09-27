"use client";

import { useState } from "react";

import { filterKanji, JLPT_KANJI } from "@/lib/kanji/kanji";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";

// Combien de kanji afficher avant d'exiger un clic sur "Charger plus" : le
// dataset est bien plus gros que grammaire/conjugaison (~2200 kanji, surtout
// concentrés en N1), donc tout rendre d'un coup alourdirait la page.
const PAGE_SIZE = 60;

// Page de référence de kanji : classés par niveau JLPT, avec filtre par
// niveau, recherche libre (kanji, lecture ou sens) et pagination locale.
// Même principe que /grammaire et /conjugaison, sur un dataset généré
// (src/lib/kanji/jlpt-kanji-data.ts) plutôt qu'écrit à la main.
export default function KanjiPage() {
  const [level, setLevel] = useState<GrammarLevel | "all">("N5");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Revient à la première page dès que le filtre change, sans passer par un
  // effet (juste une comparaison pendant le rendu, motif recommandé par React
  // pour réinitialiser un état dérivé d'une prop/valeur qui change).
  const [previousFilterKey, setPreviousFilterKey] = useState(`${level}|${query}`);
  const filterKey = `${level}|${query}`;
  if (filterKey !== previousFilterKey) {
    setPreviousFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const results = filterKanji(JLPT_KANJI, level, query);
  const visibleResults = results.slice(0, visibleCount);
  const countFor = (candidate: GrammarLevel) => JLPT_KANJI.filter((entry) => entry.level === candidate).length;

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-[var(--ink)]">Kanji par niveau JLPT</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Les kanji à connaître de N5 à N1, avec leurs lectures on&apos;yomi et
            kun&apos;yomi et leur sens. Choisis un niveau ou cherche un kanji, une
            lecture ou un sens.
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
              Tous ({JLPT_KANJI.length})
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
            placeholder="Rechercher un kanji, une lecture ou un sens (ex. 食, たべる, manger)"
            aria-label="Rechercher un kanji"
            lang="ja"
            className="mb-6 min-h-11 w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
          />

          <p className="mb-4 text-sm text-[var(--muted)]">{results.length} kanji</p>

          {visibleResults.length > 0 ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {visibleResults.map((entry) => (
                  <div key={entry.kanji} className="token-card">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-3xl font-bold text-[var(--ink)]" lang="ja">
                        {entry.kanji}
                      </span>
                      <span className="shrink-0 whitespace-nowrap rounded-sm border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 mono text-xs text-[var(--ink)]">
                        JLPT {entry.level}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[var(--ink)]">{entry.meaning}</p>
                    {entry.onReadings.length > 0 ? (
                      <p className="mt-2 text-sm text-[var(--muted)]" lang="ja">
                        <span className="eyebrow">On</span> {entry.onReadings.join("・")}
                      </p>
                    ) : null}
                    {entry.kunReadings.length > 0 ? (
                      <p className="mt-1 text-sm text-[var(--muted)]" lang="ja">
                        <span className="eyebrow">Kun</span> {entry.kunReadings.join("・")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {results.length > visibleResults.length ? (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                    className="secondary-button"
                  >
                    Charger plus ({results.length - visibleResults.length} restant(s))
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state min-h-48">
              <p className="font-medium text-[var(--ink)]">Aucun kanji ne correspond.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Essaie un autre niveau ou un autre mot-clé.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
