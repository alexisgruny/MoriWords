"use client";

import { useState } from "react";

import { jlptBadgeClass } from "@/lib/jlpt-badge";

// Démo figée de l'analyse, pour la page d'accueil publique : aucune requête
// (ni tokenizer ni Claude), juste de quoi montrer le principe en un clic.
const DEMO_TOKENS = [
  { surface: "明日", reading: "あした", meaning: "demain", note: "Nom", level: "N5" },
  { surface: "も", reading: "も", meaning: "aussi", note: "Particule qui ajoute « aussi », « même »", level: "N5" },
  { surface: "一緒に", reading: "いっしょに", meaning: "ensemble", note: "Adverbe", level: "N5" },
  {
    surface: "頑張ろう",
    reading: "がんばろう",
    meaning: "donnons-nous à fond !",
    note: "Verbe 頑張る (faire de son mieux) à la forme volitive : « faisons… ! »",
    level: "N4",
  },
] as const;

export function LandingDemo() {
  const [selected, setSelected] = useState(3);
  const token = DEMO_TOKENS[selected];

  return (
    <div className="panel">
      <p className="eyebrow mb-3">Essaie : touche un mot</p>
      <p className="flex flex-wrap items-end gap-1.5" lang="ja">
        {DEMO_TOKENS.map((entry, index) => (
          <button
            key={entry.surface}
            type="button"
            onClick={() => setSelected(index)}
            aria-pressed={index === selected}
            className={`token-card mb-0! flex w-auto! cursor-pointer flex-col items-center px-2.5 py-1.5 ${
              index === selected ? "border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]" : ""
            }`}
          >
            <span className="text-xs text-[var(--muted)]">{entry.reading}</span>
            <span className="text-2xl text-[var(--ink)]">{entry.surface}</span>
          </button>
        ))}
        <span className="pb-2 text-2xl text-[var(--ink)]">！</span>
      </p>

      <div className="mt-4 rounded-xl bg-[var(--tint)] p-4" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl font-bold text-[var(--ink)]" lang="ja">
            {token.surface}
          </span>
          <span className={jlptBadgeClass(token.level)}>{token.level}</span>
        </div>
        <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{token.meaning}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{token.note}</p>
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">
        Toute la phrase : <span className="font-semibold text-[var(--ink)]">« Demain aussi, on se donne à fond ensemble ! »</span>
      </p>
    </div>
  );
}
