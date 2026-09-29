"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { TodaySummary } from "@/lib/srs/today";

// ~10 secondes par carte en moyenne : de quoi dire « 3 minutes » plutôt
// qu'un nombre de cartes abstrait.
const SECONDS_PER_CARD = 10;

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

function isTodaySummary(value: unknown): value is TodaySummary {
  return typeof value === "object" && value !== null && "dueCount" in value && "streak" in value;
}

// Bloc « Aujourd'hui » en haut de l'accueil : ce qu'il reste à réviser, la
// série de jours et la progression, avec un seul gros bouton. Pour un
// nouveau compte, explique comment créer sa première fiche.
export function TodayPanel() {
  const [summary, setSummary] = useState<TodaySummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/today");
        const data: unknown = await response.json();

        if (!cancelled && response.ok && isTodaySummary(data)) {
          setSummary(data);
        }
      } catch {
        // Le bloc reste masqué : l'analyse reste utilisable sans lui.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary) {
    return null;
  }

  if (summary.totalCards === 0) {
    return (
      <section className="panel fade-in-up mb-8 bg-[var(--tint)]" aria-labelledby="today-title">
        <h2 id="today-title" className="text-lg font-bold text-[var(--ink)]">
          Ta première fiche t&apos;attend
        </h2>
        <p className="mt-1 text-[var(--ink)]">
          Analyse la réplique ci-dessous, touche un mot, puis ajoute-le au deck. MoriWords le traduit et lui
          trouve des exemples tout seul.
        </p>
      </section>
    );
  }

  const { streak, dueCount } = summary;
  const minutes = Math.max(1, Math.ceil((dueCount * SECONDS_PER_CARD) / 60));
  const streakText =
    streak.currentStreak > 0
      ? `🔥 ${plural(streak.currentStreak, "jour")} d'affilée${streak.reviewedToday ? "" : " : révise aujourd'hui pour la garder"}`
      : streak.longestStreak > 0
        ? `Série interrompue (record : ${plural(streak.longestStreak, "jour")}). Reprends-la aujourd'hui !`
        : "Première révision aujourd'hui ? C'est le début de ta série.";

  return (
    <section className="panel fade-in-up mb-8" aria-labelledby="today-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="today-title" className="text-lg font-bold text-[var(--ink)]">
            {dueCount > 0
              ? `${plural(dueCount, "carte")} à revoir aujourd'hui`
              : "Tout est révisé pour aujourd'hui ✓"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {dueCount > 0 ? `Environ ${plural(minutes, "minute")}. ` : "Ajoute de nouveaux mots ci-dessous. "}
            {streakText}
          </p>
        </div>
        {dueCount > 0 ? (
          <Link href="/decks/reviser" className="primary-button shrink-0 text-center">
            Réviser maintenant
          </Link>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--line)] pt-4 text-center">
        <div>
          <dt className="text-xs text-[var(--muted)]">Mots dans tes decks</dt>
          <dd className="text-xl font-bold text-[var(--ink)]">{summary.totalCards}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--muted)]">Bien ancrés</dt>
          <dd className="text-xl font-bold text-[var(--ink)]">{summary.matureCards}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--muted)]">Révisions du jour</dt>
          <dd className="text-xl font-bold text-[var(--ink)]">{summary.reviewsToday}</dd>
        </div>
      </dl>
    </section>
  );
}
