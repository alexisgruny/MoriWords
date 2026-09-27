"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useToast } from "@/components/toast-provider";
import type { DueCard } from "@/types/shared";

// Page « Réviser tout » : enchaîne les cartes dues de tous les decks, sans
// avoir à entrer dans chacun. Un seul mode simple (kanji + lecture, sens à
// deviner) : les modes contexte/quiz restent propres à chaque deck (page
// /decks/[deckId]), où le pool de leurres et les phrases de contexte sont
// disponibles.
export default function ReviewAllDuePage() {
  const { showToast } = useToast();

  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [undoableCard, setUndoableCard] = useState<{ id: string; deckId: string } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDueCards();
  }, []);

  async function loadDueCards() {
    try {
      const response = await fetch("/api/decks/due");
      const data: unknown = await response.json();

      if (response.ok && typeof data === "object" && data !== null && "cards" in data && Array.isArray(data.cards)) {
        setDueCards(data.cards as DueCard[]);
      } else {
        setError("Impossible de charger les cartes à réviser.");
      }
    } catch {
      setError("Impossible de charger les cartes à réviser.");
    } finally {
      setIsLoading(false);
    }
  }

  const activeCard = dueCards[0];

  async function submitReview(card: DueCard, quality: number) {
    setIsReviewing(true);
    setError(null);

    try {
      const response = await fetch(`/api/decks/${card.deckId}/cards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de mettre à jour la révision");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      await loadDueCards();
      setShowAnswer(false);
      setUndoableCard({ id: card.id, deckId: card.deckId });
      showToast("Révision enregistrée.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Une erreur est survenue pendant la révision.",
      );
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleUndoReview(card: { id: string; deckId: string }) {
    setIsUndoing(true);

    try {
      const response = await fetch(`/api/decks/${card.deckId}/cards/${card.id}/undo-review`, {
        method: "POST",
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible d’annuler la révision");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      await loadDueCards();
      setUndoableCard(null);
      showToast("Révision annulée.");
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "L’annulation a échoué.", "error");
    } finally {
      setIsUndoing(false);
    }
  }

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <Link href="/decks" className="eyebrow">
            ← Decks
          </Link>
          <h1 className="mt-1 text-[var(--ink)]">Réviser tout</h1>
          <p className="mt-2 text-[var(--muted)]">
            Toutes les cartes dues, tous decks confondus, dans l’ordre des plus en retard.
          </p>
        </header>

        {error ? (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <section className="panel">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[var(--ink)]">Entraînement</h2>
            <div className="flex items-center gap-3">
              {undoableCard ? (
                <button
                  type="button"
                  onClick={() => void handleUndoReview(undoableCard)}
                  disabled={isUndoing}
                  className="link-button"
                >
                  {isUndoing ? "Annulation..." : "Annuler la dernière réponse"}
                </button>
              ) : null}
              <span className="count-badge" aria-label={`${dueCards.length} carte(s) à réviser`}>
                {dueCards.length}
              </span>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-[var(--muted)]">Chargement...</p>
          ) : activeCard ? (
            <>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
                <Link href={`/decks/${activeCard.deckId}`} className="link-button text-sm!">
                  {activeCard.deck.name}
                </Link>
                <p className="mt-3 text-5xl font-bold text-[var(--ink)]" lang="ja">
                  {activeCard.lemma}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{activeCard.reading ?? "lecture inconnue"}</p>

                {showAnswer ? (
                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="text-sm font-semibold text-[var(--accent-dark)]">Réponse</p>
                    <p className="mt-1 text-lg font-medium text-[var(--ink)]">
                      {activeCard.meaning ?? "Sens à compléter"}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {!showAnswer ? (
                  <button type="button" onClick={() => setShowAnswer(true)} className="primary-button">
                    Afficher la réponse
                  </button>
                ) : (
                  <div className="grid w-full grid-cols-3 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((quality) => {
                      const labels = ["Encore", "Difficile", "Ok", "Bien", "Très bien", "Parfait"];
                      return (
                        <button
                          key={quality}
                          type="button"
                          onClick={() => void submitReview(activeCard, quality)}
                          disabled={isReviewing}
                          className="primary-button"
                        >
                          {labels[quality]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state min-h-48">
              <p className="font-medium text-[var(--ink)]">Aucune carte à revoir dans aucun deck.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Reviens plus tard, ou ajoute de nouveaux mots.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
