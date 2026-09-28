"use client";

import Link from "next/link";
import { useState } from "react";

import { FilterChips, SearchField } from "@/components/reference-toolbar";
import { KANA, KANA_GROUP_LABELS, type KanaGroup, type KanaScript, filterKana } from "@/lib/kana/kana";

const SCRIPT_LABELS: Record<KanaScript, string> = { hiragana: "Hiragana", katakana: "Katakana" };
const GROUPS: KanaGroup[] = ["base", "dakuten", "combo"];

const countFor = (script: KanaScript, group: KanaGroup | "all") =>
  KANA.filter((entry) => entry.script === script && (group === "all" || entry.group === group)).length;

// Page de référence des kana : hiragana ou katakana, filtrés par groupe
// (de base, voisés, combinés) et cherchables par romaji ou par kana. Pas
// d'ajout au deck : une carte déclencherait une traduction et des exemples
// générés par Claude, inutiles pour un simple son.
export default function KanaPage() {
  const [script, setScript] = useState<KanaScript>("hiragana");
  const [group, setGroup] = useState<KanaGroup | "all">("base");
  const [query, setQuery] = useState("");

  const results = filterKana(KANA, script, group, query);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="fade-in-up mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Référence</p>
            <h1 className="text-[var(--ink)]">Hiragana et katakana</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Les deux alphabets syllabiques du japonais, avec leur prononciation en romaji.
              Commence par les hiragana de base : ce sont eux qu&apos;on lit le plus.
            </p>
          </div>
          <Link href="/exercices/kana" className="primary-button shrink-0">
            S&apos;exercer →
          </Link>
        </header>

        <section className="panel">
          <div className="mb-3 flex flex-col gap-2.5">
            <FilterChips
              options={(["hiragana", "katakana"] as const).map((candidate) => ({
                value: candidate,
                label: SCRIPT_LABELS[candidate],
              }))}
              value={script}
              onChange={setScript}
              label="Écriture"
            />
            <FilterChips
              options={[
                { value: "all" as const, label: "Tous", count: countFor(script, "all") },
                ...GROUPS.map((candidate) => ({
                  value: candidate,
                  label: KANA_GROUP_LABELS[candidate],
                  count: countFor(script, candidate),
                })),
              ]}
              value={group}
              onChange={setGroup}
              label="Groupe"
            />
          </div>
          <div className="mb-4">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Rechercher un son (ex. ka, shi) ou un kana"
              label="Rechercher un kana"
            />
          </div>

          <p className="mb-4 text-sm text-[var(--muted)]">{results.length} kana</p>

          {results.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-8">
              {results.map((entry) => (
                <div key={entry.kana} className="token-card mb-0! flex flex-col items-center gap-1 py-3! text-center">
                  <span className="text-4xl font-bold leading-tight text-[var(--ink)]" lang="ja">
                    {entry.kana}
                  </span>
                  <span className="text-sm font-semibold text-[var(--accent-dark)]">{entry.romaji}</span>
                  <span className="text-xs text-[var(--muted)]" lang="ja" title={SCRIPT_LABELS[script === "hiragana" ? "katakana" : "hiragana"]}>
                    {entry.counterpart}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state min-h-48">
              <p className="font-medium text-[var(--ink)]">Aucun kana ne correspond.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <button
                  type="button"
                  onClick={() => {
                    setGroup("all");
                    setQuery("");
                  }}
                  className="link-button text-sm!"
                >
                  Réinitialiser les filtres
                </button>
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
