"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GradeButtons, ReviewDone, SessionProgress } from "@/components/review-controls";
import { SpeakButton } from "@/components/speak-button";
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
  const [sessionReviewed, setSessionReviewed] = useState(0);

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

  // Raccourcis clavier : espace/entrée révèle la réponse, 0-5 note la carte
  // (voir la même logique et sa justification sur la page d'entraînement
  // par deck, src/app/decks/[deckId]/page.tsx).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!activeCard || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      if (!showAnswer) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setShowAnswer(true);
        }

        return;
      }

      if (isReviewing) {
        return;
      }

      const quality = Number(event.key);

      if (Number.isInteger(quality) && quality >= 0 && quality <= 5) {
        event.preventDefault();
        void submitReview(activeCard, quality);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // submitReview est recréée à chaque rendu mais ne ferme que sur l'état
    // déjà listé ci-dessous ; on l'omet pour ne pas rebrancher l'écouteur à
    // chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCard, showAnswer, isReviewing]);

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
      setSessionReviewed((count) => count + 1);
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
        throw new Error("Impossible d'annuler la révision");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      await loadDueCards();
      setUndoableCard(null);
      setSessionReviewed((count) => Math.max(0, count - 1));
      showToast("Révision annulée.");
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "L'annulation a échoué.", "error");
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
            Toutes les cartes dues, tous decks confondus, dans l&apos;ordre des plus en retard.
          </p>
        </header>

        {error ? (
          <p className="error-banner mb-6">{error}</p>
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

          <SessionProgress reviewed={sessionReviewed} remaining={dueCards.length} />

          {isLoading ? (
            <div className="skeleton h-64 rounded-2xl" />
          ) : activeCard ? (
            <>
              <div
                key={activeCard.id}
                className="fade-in-up rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-center sm:p-8"
              >
                <Link href={`/decks/${activeCard.deckId}`} className="link-button text-sm!">
                  {activeCard.deck.name}
                </Link>
                <p className="mt-3 text-5xl font-bold text-[var(--ink)]" lang="ja">
                  {activeCard.lemma}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{activeCard.reading ?? "lecture inconnue"}</p>

                {showAnswer ? (
                  <div className="fade-in-up mt-5 border-t border-dashed border-[var(--line-strong)] pt-5">
                    <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--accent-dark)]">
                    Réponse
                    <SpeakButton text={activeCard.reading ?? activeCard.lemma} label="Écouter le mot" size="sm" />
                  </p>
                    <p className="mt-1 text-lg font-medium text-[var(--ink)]">
                      {activeCard.meaning ?? "Sens à compléter"}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {!showAnswer ? (
                  <button type="button" onClick={() => setShowAnswer(true)} className="primary-button w-full sm:w-auto">
                    Afficher la réponse <span className="kbd ml-1.5 border-white/40! bg-transparent! text-white">espace</span>
                  </button>
                ) : (
                  <GradeButtons onGrade={(quality) => void submitReview(activeCard, quality)} disabled={isReviewing} />
                )}
              </div>
            </>
          ) : (
            <ReviewDone reviewed={sessionReviewed} emptyHint="Aucun deck n'a de carte due. Reviens plus tard, ou ajoute de nouveaux mots." />
          )}
        </section>
      </div>
    </main>
  );
}
