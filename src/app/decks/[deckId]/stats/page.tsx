"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getCardStatus, isLeechCard, pickHardestCards } from "@/lib/decks/card-utils";
import type { DeckCardWithOccurrences, DeckStats } from "@/types/shared";

// Page « Statistiques » d'un deck : chiffres clés, répartition des mots par
// état d'apprentissage, mots les plus difficiles et historique des révisions.
export default function DeckStatsPage() {
  const { deckId } = useParams<{ deckId: string }>();

  const [stats, setStats] = useState<DeckStats | null>(null);
  const [cards, setCards] = useState<DeckCardWithOccurrences[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsResponse, cardsResponse] = await Promise.all([
          fetch(`/api/decks/${deckId}/stats`),
          fetch(`/api/decks/${deckId}/cards`),
        ]);
        const statsData: unknown = await statsResponse.json();
        const cardsData: unknown = await cardsResponse.json();

        if (cancelled) {
          return;
        }

        if (statsResponse.ok && typeof statsData === "object" && statsData !== null && !("error" in statsData)) {
          setStats(statsData as DeckStats);
        } else {
          setError("Impossible de charger les statistiques.");
        }

        if (
          cardsResponse.ok &&
          typeof cardsData === "object" &&
          cardsData !== null &&
          "cards" in cardsData &&
          Array.isArray(cardsData.cards)
        ) {
          setCards(cardsData.cards as DeckCardWithOccurrences[]);
        }
      } catch {
        if (!cancelled) {
          setError("Impossible de charger les statistiques.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [deckId]);

  const breakdown = {
    new: cards.filter((card) => getCardStatus(card) === "new").length,
    learning: cards.filter((card) => getCardStatus(card) === "learning").length,
    mature: cards.filter((card) => getCardStatus(card) === "mature").length,
  };
  const withoutMeaning = cards.filter((card) => !card.meaning).length;
  const leechCount = cards.filter((card) => isLeechCard(card)).length;
  const hardestCards = pickHardestCards(cards, 5);

  const summary = stats
    ? [
        { label: "Cartes", value: String(stats.totalCards) },
        { label: "À revoir", value: String(stats.dueCards) },
        { label: "Révisions", value: String(stats.totalReviews) },
        {
          label: "Réussite",
          value: stats.successRate === null ? "—" : `${Math.round(stats.successRate * 100)}%`,
        },
      ]
    : [];

  const breakdownRows = [
    { label: "Nouveaux", value: breakdown.new, color: "bg-[var(--line-strong)]" },
    { label: "En cours", value: breakdown.learning, color: "bg-[var(--warning)]" },
    { label: "Maîtrisés", value: breakdown.mature, color: "bg-[var(--success)]" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-48" />
        <div className="skeleton h-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p className="error-banner">{error}</p>
      ) : null}

      <section className="panel">
        <h2 className="text-[var(--ink)]">Vue d’ensemble</h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map((item, index) => (
            <div
              key={item.label}
              className={`fade-in-up rounded-xl border p-4 ${
                item.label === "À revoir" && item.value !== "0"
                  ? "border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-[var(--tint)]"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p
                className={`font-display mono mt-1 text-4xl font-bold ${
                  item.label === "À revoir" && item.value !== "0" ? "text-[var(--accent-dark)]" : "text-[var(--ink)]"
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {cards.length > 0 ? (
          <div className="mt-6">
            <p className="eyebrow">Répartition des mots</p>
            <div
              className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full bg-[var(--tint)]"
              role="img"
              aria-label={`${breakdown.new} nouveaux, ${breakdown.learning} en cours, ${breakdown.mature} maîtrisés`}
            >
              {breakdownRows.map((row) =>
                row.value > 0 ? (
                  <div key={row.label} className={row.color} style={{ width: `${(row.value / cards.length) * 100}%` }} />
                ) : null,
              )}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
              {breakdownRows.map((row) => (
                <li key={row.label} className="flex items-center gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${row.color}`} aria-hidden="true" />
                  <span className="font-semibold text-[var(--ink)]">{row.value}</span> {row.label.toLowerCase()}
                </li>
              ))}
              {withoutMeaning > 0 ? (
                <li>
                  <span className="font-semibold text-[var(--ink)]">{withoutMeaning}</span> sans sens
                </li>
              ) : null}
              {leechCount > 0 ? (
                <li>
                  <span className="font-semibold text-[var(--accent-dark)]">{leechCount}</span> en difficulté
                </li>
              ) : null}
            </ul>
            <p className="mt-2 text-xs text-[var(--muted)]">
              « Maîtrisé » = prochaine révision dans 21 jours ou plus.
            </p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2 className="text-[var(--ink)]">Mots les plus difficiles</h2>

        {hardestCards.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {hardestCards.map((card) => (
              <li
                key={card.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-1 py-3"
              >
                <span>
                  <span className="text-lg font-semibold text-[var(--ink)]" lang="ja">
                    {card.lemma}
                  </span>
                  <span className="ml-2 text-sm text-[var(--muted)]">{card.meaning ?? "sens à compléter"}</span>
                  {isLeechCard(card) ? (
                    <span className="ml-2 rounded-sm border border-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 text-xs font-semibold text-[var(--accent-dark)]">
                      En difficulté
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {card._count?.reviewLogs ?? 0} révision(s) · facilité {card.easeFactor?.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Pas encore assez de révisions pour repérer les mots difficiles.
          </p>
        )}
      </section>

      <section className="panel">
        <h2 className="text-[var(--ink)]">Dernières révisions</h2>

        {stats && stats.recentReviews.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {stats.recentReviews.map((review) => (
              <li
                key={review.id}
                className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-1 py-2 text-sm"
              >
                <span className="text-[var(--ink)]" lang="ja">
                  {review.lemma}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(review.reviewedAt).toLocaleString("fr-FR")}
                </span>
                <span
                  className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                    review.quality >= 3
                      ? "bg-[var(--accent-soft)] text-[var(--ink)]"
                      : "bg-[var(--warning-soft)] text-[var(--warning-dark)]"
                  }`}
                >
                  {review.quality}/5
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">Aucune révision enregistrée pour ce deck pour le moment.</p>
        )}
      </section>
    </div>
  );
}
