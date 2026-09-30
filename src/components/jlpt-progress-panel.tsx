"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { LevelProgress } from "@/lib/progress/jlpt-progress";

const percent = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);
const formatPercent = (value: number) => `${value < 10 && value > 0 ? value.toFixed(1).replace(".", ",") : Math.round(value)} %`;

// « Ma progression JLPT » : part du vocabulaire de chaque niveau déjà appris
// (réussi au moins une fois en révision) et bien ancré. Barre toujours verte :
// 2 % du N5 au début n'est pas un échec, c'est un départ.
export function JlptProgressPanel() {
  const [levels, setLevels] = useState<LevelProgress[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/progress");
        const data = (await response.json()) as { levels?: LevelProgress[] };
        if (!cancelled && response.ok && data.levels) {
          setLevels(data.levels);
        }
      } catch {
        // Bloc facultatif : rien d'affiché si le calcul échoue.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!levels) {
    return null;
  }

  // Par défaut : les niveaux entamés et le suivant, au moins N5 et N4.
  const lastStarted = levels.reduce((last, level, index) => (level.learned > 0 ? index : last), -1);
  const visible = showAll ? levels : levels.slice(0, Math.max(2, lastStarted + 2));

  return (
    <section className="panel fade-in-up mb-8" aria-labelledby="jlpt-progress-title">
      <h2 id="jlpt-progress-title" className="text-lg font-bold text-[var(--ink)]">
        Ma progression JLPT
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Les mots de chaque niveau que tu as déjà réussis en révision.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {visible.map((level) => {
          const learned = percent(level.learned, level.total);
          const mastered = percent(level.mastered, level.total);
          return (
            <li key={level.level}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-bold text-[var(--ink)]">{level.level}</span>
                <span className="text-[var(--muted)]">
                  <strong className="text-[var(--ink)]">{formatPercent(learned)}</strong> · {level.learned} / {level.total} mots
                </span>
              </div>
              {/* Deux épaisseurs : appris (clair) et bien ancrés (foncé). */}
              <div
                className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-[var(--tint)]"
                role="progressbar"
                aria-label={`${level.level} : ${level.learned} mots appris sur ${level.total}, dont ${level.mastered} bien ancrés`}
                aria-valuenow={Math.round(learned)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="absolute inset-y-0 left-0 rounded-full [background:color-mix(in_srgb,var(--success)_40%,transparent)]" style={{ width: `${Math.max(learned, level.learned > 0 ? 1.5 : 0)}%` }} />
                <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--success)]" style={{ width: `${mastered}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4 rounded-full [background:color-mix(in_srgb,var(--success)_40%,transparent)]" aria-hidden="true" />
            appris
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4 rounded-full bg-[var(--success)]" aria-hidden="true" />
            bien ancrés (revus à 3 semaines)
          </span>
        </span>
        <span className="flex items-center gap-3">
          {showAll || visible.length === levels.length ? null : (
            <button type="button" onClick={() => setShowAll(true)} className="link-button text-xs!">
              Voir tous les niveaux
            </button>
          )}
          {/* Le vocabulaire vu ici, l'examen blanc pour le vérifier. */}
          <Link href="/paliers" className="link-button text-xs!">
            Passer un palier →
          </Link>
        </span>
      </div>
    </section>
  );
}
