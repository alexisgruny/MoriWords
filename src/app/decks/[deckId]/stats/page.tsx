"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getCardStatus, pickHardestCards } from "@/lib/decks/card-utils";
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
    { label: "Nouveaux", value: breakdown.new, color: "bg-[var(--line)]" },
    { label: "En cours", value: breakdown.learning, color: "bg-[var(--accent-soft)]" },
    { label: "Maîtrisés", value: breakdown.mature, color: "bg-[var(--accent)]" },
  ];

  if (isLoading) {
    return <p className="text-sm text-[var(--muted)]">Chargement des statistiques...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="panel p-6 sm:p-8">
        <p className="eyebrow">Progress</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Vue d’ensemble</h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>

        {cards.length > 0 ? (
          <div className="mt-6">
            <p className="eyebrow">Répartition des mots</p>
            <div
              className="mt-3 flex h-3 overflow-hidden rounded-full border border-[var(--line)]"
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
                <li key={row.label}>
                  <span className="font-semibold text-[var(--ink)]">{row.value}</span> {row.label.toLowerCase()}
                </li>
              ))}
              {withoutMeaning > 0 ? (
                <li>
                  <span className="font-semibold text-[var(--ink)]">{withoutMeaning}</span> sans sens
                </li>
              ) : null}
            </ul>
            <p className="mt-2 text-xs text-[var(--muted)]">
              « Maîtrisé » = prochaine révision dans 21 jours ou plus.
            </p>
          </div>
        ) : null}
      </section>

      <section className="panel p-6 sm:p-8">
        <p className="eyebrow">À travailler</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Mots les plus difficiles</h2>

        {hardestCards.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {hardestCards.map((card) => (
              <li
                key={card.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-3"
              >
                <span>
                  <span className="text-lg font-semibold text-[var(--ink)]" lang="ja">
                    {card.lemma}
                  </span>
                  <span className="ml-2 text-sm text-[var(--muted)]">{card.meaning ?? "sens à compléter"}</span>
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

      <section className="panel p-6 sm:p-8">
        <p className="eyebrow">Historique</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Dernières révisions</h2>

        {stats && stats.recentReviews.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {stats.recentReviews.map((review) => (
              <li
                key={review.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--ink)]" lang="ja">
                  {review.lemma}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(review.reviewedAt).toLocaleString("fr-FR")}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    review.quality >= 3 ? "bg-[var(--accent-soft)] text-[var(--ink)]" : "bg-red-50 text-red-700"
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
