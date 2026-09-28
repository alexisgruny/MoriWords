"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FilterChips, SearchField } from "@/components/reference-toolbar";
import { useToast } from "@/components/toast-provider";
import { readApiError } from "@/lib/api-error";
import { type CardStatus, getCardStatus, isLeechCard } from "@/lib/decks/card-utils";
import type { DeckCardWithOccurrences, DeckSummary } from "@/types/shared";

type WordFilter = "all" | CardStatus | "no-meaning" | "leech";

const filters: Array<{ id: WordFilter; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "new", label: "Nouveaux" },
  { id: "learning", label: "En cours" },
  { id: "mature", label: "Maîtrisés" },
  { id: "no-meaning", label: "Sans sens" },
  { id: "leech", label: "En difficulté" },
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

  if (filter === "leech") {
    return isLeechCard(card);
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
  const [editingReading, setEditingReading] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [isSavingMeaning, setIsSavingMeaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingExamplesId, setGeneratingExamplesId] = useState<string | null>(null);
  const [translateProgress, setTranslateProgress] = useState<{ done: number; total: number } | null>(null);

  const [otherDecks, setOtherDecks] = useState<DeckSummary[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveTargetDeckId, setMoveTargetDeckId] = useState("");
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [bulkDeletionPending, setBulkDeletionPending] = useState(false);

  useEffect(() => {
    void loadCards();
    // loadCards closes over deckId and is also called after mutations below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Charge la liste des autres decks une seule fois, pour le menu « Déplacer vers ».
  useEffect(() => {
    async function loadOtherDecks() {
      try {
        const response = await fetch("/api/decks");
        const data: unknown = await response.json();

        if (response.ok && typeof data === "object" && data !== null && "decks" in data && Array.isArray(data.decks)) {
          setOtherDecks((data.decks as DeckSummary[]).filter((deck) => deck.id !== deckId));
        }
      } catch {
        // Le menu restera vide ; on retentera à la prochaine visite de la page.
      }
    }

    void loadOtherDecks();
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

  // Génère les phrases d'exemple d'une carte qui n'en a pas encore.
  async function handleGenerateExamples(cardId: string) {
    setGeneratingExamplesId(cardId);

    try {
      const response = await fetch(`/api/decks/${deckId}/cards/${cardId}/examples`, { method: "POST" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "examples failed");
      }

      await loadCards();
    } catch (exampleError) {
      showToast(
        exampleError instanceof Error && exampleError.message !== "examples failed"
          ? exampleError.message
          : "La génération des exemples a échoué.",
        "error",
      );
    } finally {
      setGeneratingExamplesId(null);
    }
  }

  // Supprime une carte du deck et rafraîchit la liste.
  async function handleDeleteCard(cardId: string) {
    try {
      const response = await fetch(`/api/decks/${deckId}/cards/${cardId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error(await readApiError(response, "La suppression de la carte a échoué."));
      }

      await loadCards();
      showToast("Carte supprimée.");
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "La suppression de la carte a échoué.", "error");
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

  // Enregistre la lecture et le sens édités à la main.
  async function handleSaveEdits(card: DeckCardWithOccurrences) {
    const meaning = editingValue.trim();
    const reading = editingReading.trim();

    if (!meaning) {
      return;
    }

    setIsSavingMeaning(true);

    try {
      const response = await fetch(`/api/decks/${deckId}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading, meaning }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "La mise à jour du mot a échoué."));
      }

      await loadCards();
      setEditingCardId(null);
      showToast("Mot mis à jour.");
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "La mise à jour du mot a échoué.", "error");
    } finally {
      setIsSavingMeaning(false);
    }
  }

  // Coche/décoche une carte dans la sélection multiple.
  function toggleSelected(cardId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }

      return next;
    });
  }

  // Supprime toutes les cartes sélectionnées, une par une (comme le reste du
  // site : pas d'endpoint bulk dédié, mais des appels en parallèle).
  async function handleBulkDelete() {
    setIsBulkWorking(true);

    try {
      const results = await Promise.allSettled(
        [...selectedIds].map((cardId) =>
          fetch(`/api/decks/${deckId}/cards/${cardId}`, { method: "DELETE" }).then(async (response) => {
            if (!response.ok) {
              throw new Error(await readApiError(response, "delete failed"));
            }
          }),
        ),
      );

      const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
      const succeededCount = results.length - failures.length;

      if (succeededCount > 0) {
        showToast(`${succeededCount} mot(s) supprimé(s).`);
      }

      if (failures.length > 0) {
        // Un refus "propriétaire" vaut pour tout le lot : autant le dire.
        const ownerRefusal = failures.find((failure) => (failure.reason as Error).message.includes("propriétaire"));
        showToast(
          ownerRefusal ? (ownerRefusal.reason as Error).message : `${failures.length} mot(s) n’ont pas pu être supprimés.`,
          "error",
        );
      }

      setSelectedIds(new Set());
      await loadCards();
    } finally {
      setIsBulkWorking(false);
    }
  }

  // Déplace toutes les cartes sélectionnées vers un autre deck. Un mot déjà
  // présent dans le deck cible est refusé par l'API (409) : on le compte à
  // part plutôt que de le traiter comme une simple erreur.
  async function handleBulkMove() {
    if (!moveTargetDeckId) {
      return;
    }

    setIsBulkWorking(true);

    try {
      const results = await Promise.allSettled(
        [...selectedIds].map(async (cardId) => {
          const response = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deckId: moveTargetDeckId }),
          });

          if (!response.ok) {
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(response.status === 409 ? "conflict" : data.error ?? "move failed");
          }
        }),
      );

      const conflictCount = results.filter(
        (result) => result.status === "rejected" && (result.reason as Error).message === "conflict",
      ).length;
      const otherFailedCount = results.filter(
        (result) => result.status === "rejected" && (result.reason as Error).message !== "conflict",
      ).length;
      const succeededCount = results.length - conflictCount - otherFailedCount;

      if (succeededCount > 0) {
        showToast(`${succeededCount} mot(s) déplacé(s).`);
      }

      if (conflictCount > 0) {
        showToast(`${conflictCount} mot(s) existaient déjà dans le deck cible.`, "error");
      }

      if (otherFailedCount > 0) {
        const ownerRefusal = results.find(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected" && (result.reason as Error).message.includes("propriétaire"),
        );
        showToast(
          ownerRefusal ? (ownerRefusal.reason as Error).message : `${otherFailedCount} mot(s) n’ont pas pu être déplacés.`,
          "error",
        );
      }

      setSelectedIds(new Set());
      setMoveTargetDeckId("");
      await loadCards();
    } finally {
      setIsBulkWorking(false);
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
      <section className="panel">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-[var(--ink)]">Mots du deck</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted)]">{visibleCards.length} mot(s)</span>
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode((current) => !current);
                setSelectedIds(new Set());
              }}
              className="link-button"
            >
              {isSelectionMode ? "Terminer la sélection" : "Sélectionner"}
            </button>
          </div>
        </div>

        {isSelectionMode ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--tint)] px-4 py-3">
            <p className="text-sm text-[var(--ink)]">
              {selectedIds.size > 0 ? `${selectedIds.size} mot(s) sélectionné(s)` : "Aucun mot sélectionné"}
            </p>
            <select
              value={moveTargetDeckId}
              onChange={(event) => setMoveTargetDeckId(event.target.value)}
              aria-label="Deck de destination"
              disabled={selectedIds.size === 0 || otherDecks.length === 0}
              className="min-h-9 cursor-pointer border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1 text-sm text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <option value="">Déplacer vers...</option>
              {otherDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleBulkMove()}
              disabled={selectedIds.size === 0 || !moveTargetDeckId || isBulkWorking}
              className="secondary-button px-3! py-1.5! text-xs!"
            >
              Déplacer
            </button>
            <button
              type="button"
              onClick={() => setBulkDeletionPending(true)}
              disabled={selectedIds.size === 0 || isBulkWorking}
              className="secondary-button px-3! py-1.5! text-xs! border-[var(--danger)]! text-[var(--danger)]! hover:bg-[var(--accent-soft)]!"
            >
              Supprimer la sélection
            </button>
          </div>
        ) : null}

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

        <div className="mb-3">
          <FilterChips
            options={filters.map((option) => ({ value: option.id, label: option.label, count: countFor(option.id) }))}
            value={filter}
            onChange={setFilter}
            label="Filtrer les mots"
          />
        </div>

        <div className="mb-5">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Rechercher un mot (kanji, lecture, sens)"
            label="Rechercher un mot"
          />
        </div>

        {error ? (
          <p className="error-banner mb-4">{error}</p>
        ) : null}

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="skeleton h-36" />
            <div className="skeleton h-36" />
            <div className="skeleton h-36" />
            <div className="skeleton h-36" />
          </div>
        ) : visibleCards.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleCards.map((card) => {
              const status = getCardStatus(card);
              const isExpanded = expandedCardId === card.id;
              const contexts = card.occurrences.filter((occurrence) => occurrence.sourceText !== null);

              return (
                <div key={card.id} className="token-card mb-0!">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {isSelectionMode ? (
                        <label className="-m-1.5 flex shrink-0 cursor-pointer items-center p-1.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(card.id)}
                            onChange={() => toggleSelected(card.id)}
                            aria-label={`Sélectionner « ${card.lemma} »`}
                            className="h-5 w-5 shrink-0"
                          />
                        </label>
                      ) : null}
                      <div>
                        <span className="text-xl font-semibold text-[var(--ink)]" lang="ja">
                          {card.lemma}
                        </span>
                        <span className="ml-2 text-sm text-[var(--accent-dark)]" lang="ja">
                          {card.reading ?? "lecture inconnue"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isLeechCard(card) ? (
                        <span className="whitespace-nowrap rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-dark)]">
                          En difficulté
                        </span>
                      ) : null}
                      {/* Mêmes couleurs que la répartition de la page Statistiques. */}
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          status === "mature"
                            ? "bg-[var(--success-soft)] text-[var(--success-dark)]"
                            : status === "learning"
                              ? "bg-[var(--warning-soft)] text-[var(--warning-dark)]"
                              : "bg-[var(--tint)] text-[var(--muted)]"
                        }`}
                      >
                        {statusLabels[status]}
                      </span>
                    </div>
                  </div>

                  {editingCardId === card.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={editingReading}
                          onChange={(event) => setEditingReading(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              void handleSaveEdits(card);
                            }
                          }}
                          placeholder="Lecture (hiragana)"
                          aria-label={`Lecture de « ${card.lemma} »`}
                          lang="ja"
                          autoFocus
                          className="min-h-9 min-w-0 flex-1 border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none"
                        />
                        <input
                          value={editingValue}
                          onChange={(event) => setEditingValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              void handleSaveEdits(card);
                            }
                          }}
                          placeholder="Sens en français"
                          aria-label={`Sens de « ${card.lemma} »`}
                          className="min-h-9 min-w-0 flex-1 border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void handleSaveEdits(card)}
                          disabled={isSavingMeaning || editingValue.trim().length === 0}
                          className="primary-button px-3.5! py-1.5! text-sm!"
                        >
                          {isSavingMeaning ? "..." : "Enregistrer"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCardId(null)}
                          className="link-button text-sm!"
                        >
                          Annuler
                        </button>
                      </div>
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
                    <div className="fade-in-up mt-3 border-t border-[var(--line)] pt-3">
                      <p className="eyebrow">Exemples</p>
                      {card.examples && card.examples.length > 0 ? (
                        <ul className="mt-2 flex flex-col gap-3">
                          {card.examples.map((example) => (
                            <li key={example.id} className="border-l-2 border-[var(--line)] py-1 pl-3">
                              <p className="text-base text-[var(--ink)]" lang="ja">
                                {example.japanese}
                              </p>
                              {example.reading ? (
                                <p className="text-sm text-[var(--accent-dark)]" lang="ja">
                                  {example.reading}
                                </p>
                              ) : null}
                              <p className="mt-0.5 text-sm text-[var(--muted)]">{example.translation}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <p className="text-sm text-[var(--muted)]">Aucun exemple pour ce mot.</p>
                          <button
                            type="button"
                            onClick={() => void handleGenerateExamples(card.id)}
                            disabled={generatingExamplesId === card.id}
                            className="link-button"
                          >
                            {generatingExamplesId === card.id ? "Génération..." : "Générer 5 exemples"}
                          </button>
                        </div>
                      )}

                      <p className="eyebrow mt-4">Contextes</p>
                      {contexts.length > 0 ? (
                        <ul className="mt-2 flex flex-col gap-2">
                          {contexts.map((occurrence) => (
                            <li
                              key={occurrence.id}
                              className="border-l-2 border-[var(--line)] py-1 pl-3 text-sm text-[var(--ink)]"
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

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {editingCardId !== card.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCardId(card.id);
                          setEditingReading(card.reading ?? "");
                          setEditingValue(card.meaning ?? "");
                        }}
                        className="chip px-3! py-1! text-xs!"
                      >
                        Éditer
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                      aria-expanded={isExpanded}
                      className={`chip px-3! py-1! text-xs! ${isExpanded ? "border-[var(--accent)]! bg-[var(--accent-soft)]!" : ""}`}
                    >
                      {isExpanded ? "Masquer exemples et contextes" : "Exemples et contextes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardPendingDeletion(card)}
                      className="chip ml-auto px-3! py-1! text-xs! text-[var(--danger)]!"
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
            <span className="empty-state-icon" aria-hidden="true">
              {cards.length === 0 ? (
                <span lang="ja">語</span>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m20 20-4.2-4.2" />
                </svg>
              )}
            </span>
            <p className="font-medium text-[var(--ink)]">
              {cards.length === 0 ? "Aucun mot dans ce deck pour le moment." : "Aucun mot ne correspond."}
            </p>
            {cards.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Ajoute des mots depuis la page{" "}
                <Link href="/" className="link-button text-sm!">
                  Analyser
                </Link>
                .
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                  className="link-button text-sm!"
                >
                  Réinitialiser les filtres
                </button>
              </p>
            )}
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

      <ConfirmDialog
        open={bulkDeletionPending}
        title="Supprimer ces mots ?"
        description={`${selectedIds.size} mot(s) seront définitivement supprimés de ce deck, avec leur historique de révision.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          setBulkDeletionPending(false);
          void handleBulkDelete();
        }}
        onCancel={() => setBulkDeletionPending(false)}
      />
    </>
  );
}
