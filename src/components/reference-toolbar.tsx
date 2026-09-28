"use client";

import type { ReactNode } from "react";

import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";

// Barre de filtres commune aux pages de référence (grammaire, conjugaison,
// kanji), qui dupliquaient chacune le même code : niveaux JLPT en pastilles
// avec leur nombre d'éléments, puis une recherche. Collée en haut de l'écran
// pendant le défilement (à partir de la largeur tablette), pour pouvoir
// changer de niveau ou de recherche au milieu d'une longue liste (~2 200
// kanji) sans remonter.
export function ReferenceToolbar({
  level,
  onLevelChange,
  counts,
  total,
  query,
  onQueryChange,
  placeholder,
  searchLabel,
  searchLang,
  extra,
}: {
  level: GrammarLevel | "all";
  onLevelChange: (level: GrammarLevel | "all") => void;
  counts: Record<GrammarLevel, number>;
  total: number;
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  searchLabel: string;
  searchLang?: string;
  extra?: ReactNode;
}) {
  const options: Array<{ value: GrammarLevel | "all"; label: string; count: number }> = [
    { value: "all", label: "Tous", count: total },
    ...GRAMMAR_LEVELS.map((candidate) => ({ value: candidate, label: candidate, count: counts[candidate] })),
  ];

  return (
    // Pas collée sur téléphone : avec deux lignes de niveaux et la recherche,
    // elle prendrait un quart de l'écran en permanence.
    <div className="-mx-1 mb-5 bg-[var(--paper)] px-1 pt-1 pb-4 sm:sticky sm:top-0 sm:z-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Niveau JLPT">
          {options.map((option) => {
            const isActive = level === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onLevelChange(option.value)}
                aria-pressed={isActive}
                className={`chip ${isActive ? "border-[var(--accent)]! bg-[var(--accent)]! text-white!" : ""}`}
              >
                {option.label}
                <span className={`mono text-xs ${isActive ? "opacity-80" : "text-[var(--muted)]"}`}>{option.count}</span>
              </button>
            );
          })}
        </div>
        {extra}
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        </svg>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          aria-label={searchLabel}
          lang={searchLang}
          className="min-h-11 w-full rounded-full border border-[var(--line-strong)] bg-[var(--paper)] py-2 pr-10 pl-10 text-[var(--ink)] outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Effacer la recherche"
            className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--ink)]"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}

// Chevron d'une entrée <details> dépliable (pivote à l'ouverture, voir
// .details-chevron dans globals.css).
export function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="details-chevron"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// État vide commun : aucun résultat pour le niveau/la recherche en cours.
export function NoResults({ title, onReset }: { title: string; onReset: () => void }) {
  return (
    <div className="empty-state min-h-48">
      <span className="empty-state-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        </svg>
      </span>
      <p className="font-medium text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Essaie un autre niveau ou un autre mot-clé, ou{" "}
        <button type="button" onClick={onReset} className="link-button text-sm!">
          réinitialise les filtres
        </button>
        .
      </p>
    </div>
  );
}
