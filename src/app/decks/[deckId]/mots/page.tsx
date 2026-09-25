"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { type CardStatus, getCardStatus } from "@/lib/decks/card-utils";
import type { DeckCardWithOccurrences } from "@/types/shared";

type WordFilter = "all" | CardStatus | "no-meaning";

const filters: Array<{ id: WordFilter; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "new", label: "Nouveaux" },
  { id: "learning", label: "En cours" },
  { id: "mature", label: "Maîtrisés" },
  { id: "no-meaning", label: "Sans sens" },
];

const statusLabels: Record<CardStatus, string> = {
  new: "Nouveau",
  learning: "En cours",
  mature: "Maîtrisé",
};

// Indique si une carte correspond à un des filtres (statut d'apprentissage ou "sans sens").
function matchesFilter(card: DeckCardWithOccurrences, filter: WordFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "no-meaning") {
    return !card.meaning;
  }

  return getCardStatus(card) === filter;
}

// Décrit en français quand la carte sera à revoir.
function describeNextReview(card: DeckCardWithOccurrences): string {
  const reviewCount = card._count?.reviewLogs ?? card.repetitions ?? 0;

  if (reviewCount === 0 || !card.dueAt) {
    return "Pas encore révisé";
  }

  const days = Math.ceil((new Date(card.dueAt).getTime() - Date.now()) / 86_400_000);

  if (days <= 0) {
    return "À revoir maintenant";
  }

  return days === 1 ? "À revoir demain" : `À revoir dans ${days} jours`;
}

// Page « Mots » d'un deck : tous les mots avec leur définition, leur état
// d'apprentissage, recherche/filtres, édition du sens et suppression.
export default function DeckWordsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { showToast } = useToast();

  const [cards, setCards] = useState<DeckCardWithOccurrences[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WordFilter>("all");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [cardPendingDeletion, setCardPendingDeletion] = useState<DeckCardWithOccurrences | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isSavingMeaning, setIsSavingMeaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translateProgress, setTranslateProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    void loadCards();
    // loadCards closes over deckId and is also called after mutations below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  async function loadCards() {
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`);
      const data: unknown = await response.json();

      if (response.ok && typeof data === "object" && data !== null && "cards" in data && Array.isArray(data.cards)) {
        setCards(data.cards as DeckCardWithOccurrences[]);
      } else {
        setError("Impossible de charger les mots du deck.");
      }
    } catch {
      setError("Impossible de charger les mots du deck.");
    } finally {
      setIsLoading(false);
    }
  }

  // Supprime une carte du deck et rafraîchit la liste.
  async function handleDeleteCard(cardId: string) {
    try {
      const response = await fetch(`/api/decks/${deckId}/cards/${cardId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("delete failed");
      }

      await loadCards();
      showToast("Carte supprimée.");
    } catch {
      showToast("La suppression de la carte a échoué.", "error");
    }
  }

  // Traduit automatiquement tous les mots du deck qui n'ont pas de sens, par
  // petits lots (l'API en traite quelques-uns à chaque appel). Les mots dont la
  // traduction échoue sont mis de côté pour ne pas boucler dessus.
  async function handleTranslateMissing() {
    const total = cards.filter((card) => !card.meaning).length;

    if (total === 0) {
      return;
    }

    setTranslateProgress({ done: 0, total });
    setError(null);

    const failedIds = new Set<string>();
    let translatedCount = 0;

    try {
      let remaining = total;

      while (remaining > 0) {
        const response = await fetch(`/api/decks/${deckId}/cards/translate-missing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ excludeIds: [...failedIds] }),
        });
        const data = (await response.json()) as {
          translated?: number;
          failedIds?: string[];
          remaining?: number;
        };

        if (!response.ok || typeof data.translated !== "number" || typeof data.remaining !== "number") {
          throw new Error("translate-missing failed");
        }

        translatedCount += data.translated;
        (data.failedIds ?? []).forEach((id) => failedIds.add(id));
        remaining = data.remaining;
        setTranslateProgress({ done: translatedCount + failedIds.size, total });

        if (data.translated === 0 && (data.failedIds ?? []).length === 0) {
          break;
        }
      }

      if (translatedCount > 0) {
        showToast(`${translatedCount} mot(s) traduit(s).`);
      }

      if (failedIds.size > 0) {
        showToast(`${failedIds.size} mot(s) n’ont pas pu être traduits.`, "error");
      }
    } catch {
      showToast("La traduction des mots a échoué.", "error");
    } finally {
      await loadCards();
      setTranslateProgress(null);
    }
  }

  // Enregistre le sens saisi à la main : la route d'ajout met à jour la carte
  // existante (même lemme dans ce deck) au lieu d'en créer une nouvelle.
  async function handleSaveMeaning(card: DeckCardWithOccurrences) {
    const meaning = editingValue.trim();

    if (!meaning) {
      return;
    }

    setIsSavingMeaning(true);

    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lemma: card.lemma, reading: card.reading, meaning }),
      });

      if (!response.ok) {
        throw new Error("save failed");
      }

      await loadCards();
      setEditingCardId(null);
      showToast("Sens mis à jour.");
    } catch {
      showToast("La mise à jour du sens a échoué.", "error");
    } finally {
      setIsSavingMeaning(false);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCards = cards.filter((card) => {
    if (!matchesFilter(card, filter)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [card.lemma, card.reading, card.meaning]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  const missingMeaningCount = cards.filter((card) => !card.meaning).length;
  const countFor = (candidate: WordFilter) => cards.filter((card) => matchesFilter(card, candidate)).length;

  return (
    <>
      <section className="panel p-6 sm:p-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Vocabulaire</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Mots du deck</h2>
          </div>
          <span className="text-sm text-[var(--muted)]">{visibleCards.length} mot(s)</span>
        </div>

        {missingMeaningCount > 0 ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] px-4 py-3">
            <p className="text-sm text-[var(--ink)]">
              {translateProgress
                ? `Traduction en cours… ${translateProgress.done}/${translateProgress.total}`
                : `${missingMeaningCount} mot(s) n’ont pas encore de sens.`}
            </p>
            <button
              type="button"
              onClick={() => void handleTranslateMissing()}
              disabled={translateProgress !== null}
              className="primary-button px-4! py-2! text-xs!"
            >
              {translateProgress ? "Traduction..." : "Traduire automatiquement"}
            </button>
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer les mots">
          {filters.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                filter === option.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
              }`}
            >
              {option.label} ({countFor(option.id)})
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un mot (kanji, lecture, sens)"
          aria-label="Rechercher un mot"
          className="mb-5 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
        />

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-[var(--muted)]">Chargement des mots...</p>
        ) : visibleCards.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleCards.map((card) => {
              const status = getCardStatus(card);
              const isExpanded = expandedCardId === card.id;
              const contexts = card.occurrences.filter((occurrence) => occurrence.sourceText !== null);

              return (
                <div key={card.id} className="token-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xl font-semibold text-[var(--ink)]" lang="ja">
                        {card.lemma}
                      </span>
                      <span className="ml-2 text-sm text-[var(--accent-dark)]" lang="ja">
                        {card.reading ?? "lecture inconnue"}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        status === "mature"
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                          : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                      }`}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>

                  {editingCardId === card.id ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        value={editingValue}
                        onChange={(event) => setEditingValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            void handleSaveMeaning(card);
                          }
                        }}
                        placeholder="Sens en français"
                        aria-label={`Sens de « ${card.lemma} »`}
                        autoFocus
                        className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSaveMeaning(card)}
                        disabled={isSavingMeaning || editingValue.trim().length === 0}
                        className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-55"
                      >
                        {isSavingMeaning ? "..." : "Enregistrer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCardId(null)}
                        className="text-xs text-[var(--muted)] underline"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-base font-medium text-[var(--ink)]">
                      {card.meaning ?? <span className="text-[var(--muted)]">Sens à compléter</span>}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-[var(--muted)]">
                    {describeNextReview(card)} · {card._count?.reviewLogs ?? 0} révision(s) ·{" "}
                    {card.occurrences.length} texte(s)
                  </p>

                  {isExpanded ? (
                    <div className="mt-3 border-t border-[var(--line)] pt-3">
                      <p className="eyebrow">Contextes</p>
                      {contexts.length > 0 ? (
                        <ul className="mt-2 flex flex-col gap-2">
                          {contexts.map((occurrence) => (
                            <li
                              key={occurrence.id}
                              className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--ink)]"
                              lang="ja"
                            >
                              {occurrence.sourceText?.content}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-[var(--muted)]">Aucun texte enregistré pour ce mot.</p>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {editingCardId !== card.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCardId(card.id);
                          setEditingValue(card.meaning ?? "");
                        }}
                        className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)]"
                      >
                        Éditer le sens
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                      aria-expanded={isExpanded}
                      className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)]"
                    >
                      {isExpanded ? "Masquer les contextes" : "Voir les contextes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardPendingDeletion(card)}
                      className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state min-h-48">
            <p className="font-medium text-[var(--ink)]">
              {cards.length === 0 ? "Aucun mot dans ce deck pour le moment." : "Aucun mot ne correspond."}
            </p>
            {cards.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">Ajoute des mots depuis la page Analyser.</p>
            ) : null}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={cardPendingDeletion !== null}
        title="Supprimer cette carte ?"
        description={
          cardPendingDeletion
            ? `« ${cardPendingDeletion.lemma} » sera définitivement supprimée de ce deck, avec son historique de révision.`
            : undefined
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          if (cardPendingDeletion) {
            void handleDeleteCard(cardPendingDeletion.id);
          }
          setCardPendingDeletion(null);
        }}
        onCancel={() => setCardPendingDeletion(null)}
      />
    </>
  );
}
