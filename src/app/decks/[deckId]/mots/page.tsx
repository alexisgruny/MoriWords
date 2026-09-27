"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
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
        throw new Error("save failed");
      }

      await loadCards();
      setEditingCardId(null);
      showToast("Mot mis à jour.");
    } catch {
      showToast("La mise à jour du mot a échoué.", "error");
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
          fetch(`/api/decks/${deckId}/cards/${cardId}`, { method: "DELETE" }).then((response) => {
            if (!response.ok) {
              throw new Error("delete failed");
            }
          }),
        ),
      );

      const failedCount = results.filter((result) => result.status === "rejected").length;
      const succeededCount = results.length - failedCount;

      if (succeededCount > 0) {
        showToast(`${succeededCount} mot(s) supprimé(s).`);
      }

      if (failedCount > 0) {
        showToast(`${failedCount} mot(s) n’ont pas pu être supprimés.`, "error");
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
        showToast(`${otherFailedCount} mot(s) n’ont pas pu être déplacés.`, "error");
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
              className="min-h-9 rounded-sm border border-[var(--line-strong)] bg-[var(--paper)] px-2 py-1 text-sm text-[var(--ink)]"
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
              className="secondary-button px-3! py-1.5! text-xs! border-red-200! text-red-600! hover:bg-red-50!"
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

        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer les mots">
          {filters.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={`rounded-sm border px-3.5 py-1.5 text-sm font-medium transition ${
                filter === option.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                  : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
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
          className="mb-5 min-h-11 w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
        />

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-[var(--muted)]">Chargement des mots...</p>
        ) : visibleCards.length > 0 ? (
          <div className="grid md:grid-cols-2 md:gap-x-10">
            {visibleCards.map((card) => {
              const status = getCardStatus(card);
              const isExpanded = expandedCardId === card.id;
              const contexts = card.occurrences.filter((occurrence) => occurrence.sourceText !== null);

              return (
                <div key={card.id} className="token-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {isSelectionMode ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(card.id)}
                          onChange={() => toggleSelected(card.id)}
                          aria-label={`Sélectionner « ${card.lemma} »`}
                          className="mt-1.5 h-4 w-4 shrink-0"
                        />
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
                        <span className="whitespace-nowrap rounded-sm border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-dark)]">
                          En difficulté
                        </span>
                      ) : null}
                      <span
                        className={`whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-semibold ${
                          status === "mature"
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                            : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
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
                          placeholder="Lecture (hiragana)"
                          aria-label={`Lecture de « ${card.lemma} »`}
                          lang="ja"
                          className="min-w-0 flex-1 rounded-sm border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
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
                          autoFocus
                          className="min-w-0 flex-1 rounded-sm border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveEdits(card)}
                          disabled={isSavingMeaning || editingValue.trim().length === 0}
                          className="rounded-sm bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-55"
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

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {editingCardId !== card.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCardId(card.id);
                          setEditingReading(card.reading ?? "");
                          setEditingValue(card.meaning ?? "");
                        }}
                        className="rounded-sm border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)]"
                      >
                        Éditer
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                      aria-expanded={isExpanded}
                      className="rounded-sm border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)]"
                    >
                      {isExpanded ? "Masquer exemples et contextes" : "Exemples et contextes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardPendingDeletion(card)}
                      className="rounded-sm border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
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
