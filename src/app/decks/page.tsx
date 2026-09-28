"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProgressBar } from "@/components/progress-bar";
import { StreakBanner } from "@/components/streak-banner";
import { useToast } from "@/components/toast-provider";
import { readApiError } from "@/lib/api-error";
import type { DeckSummary } from "@/types/shared";

// Une carte est due si elle n'a jamais été révisée, ou si sa date
// d'échéance est passée (même logique que la page de détail d'un deck).
function isCardDue(dueAt?: string | null): boolean {
  return !dueAt || new Date(dueAt).getTime() <= Date.now();
}

// Page qui liste tous les decks de l'utilisateur et permet d'en créer un nouveau.
export default function DecksPage() {
  const { showToast } = useToast();
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [deckName, setDeckName] = useState("Mon deck japonais");
  const [error, setError] = useState<string | null>(null);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [deckPendingDeletion, setDeckPendingDeletion] = useState<DeckSummary | null>(null);
  // Sans cet état, "Aucun deck pour le moment" s'affichait une fraction de
  // seconde avant l'arrivée de la vraie liste.
  const [isLoading, setIsLoading] = useState(true);

  // Va chercher la liste de tous les decks sur le serveur.
  async function fetchDecks() {
    try {
      const response = await fetch("/api/decks");
      const data: unknown = await response.json();

      if (
        response.ok &&
        typeof data === "object" &&
        data !== null &&
        "decks" in data &&
        Array.isArray(data.decks)
      ) {
        setDecks(data.decks as DeckSummary[]);
      }
    } catch {
      // The deck list can be refreshed again later.
    } finally {
      setIsLoading(false);
    }
  }

  // Charge la liste des decks dès l'affichage de la page.
  useEffect(() => {
    async function loadInitialDecks() {
      await fetchDecks();
    }

    void loadInitialDecks();
  }, []);

  // Crée un nouveau deck avec le nom saisi et l'ajoute à la liste affichée.
  async function handleCreateDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = deckName.trim();

    if (!trimmedName) {
      setError("Le nom du deck est requis.");
      return;
    }

    setIsCreatingDeck(true);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de créer le deck");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      if (!("deck" in data) || typeof data.deck !== "object" || data.deck === null) {
        throw new Error("Réponse inattendue lors de la création du deck");
      }

      const nextDeck = data.deck as DeckSummary;
      setDecks((current) => [nextDeck, ...current.filter((deck) => deck.id !== nextDeck.id)]);
      setError(null);
      showToast(`Deck « ${nextDeck.name} » créé.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la création du deck.",
      );
    } finally {
      setIsCreatingDeck(false);
    }
  }

  // Supprime un deck (et ses cartes) après confirmation, puis rafraîchit la liste.
  async function handleDeleteDeck(deckId: string) {
    try {
      const response = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error(await readApiError(response, "La suppression du deck a échoué."));
      }

      setDecks((current) => current.filter((deck) => deck.id !== deckId));
      showToast("Deck supprimé.");
    } catch (requestError) {
      showToast(
        requestError instanceof Error ? requestError.message : "La suppression du deck a échoué.",
        "error",
      );
    }
  }

  // Nombre de cartes dues par deck, et total tous decks confondus, pour le
  // résumé du jour : éviter d'avoir à rentrer dans chaque deck pour savoir
  // ce qu'il y a à réviser.
  const decksWithDueCount = decks
    .map((deck) => ({
      deck,
      dueCount: deck.cards.filter((card) => isCardDue(card.dueAt)).length,
    }))
    .filter((entry) => entry.dueCount > 0)
    .sort((a, b) => b.dueCount - a.dueCount);
  const totalDueCount = decksWithDueCount.reduce((sum, entry) => sum + entry.dueCount, 0);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <StreakBanner />

        <header className="mb-8">
          <h1 className="text-[var(--ink)]">Decks</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Tes listes de vocabulaire. Ouvre un deck pour t&apos;entraîner, ou crée-en un nouveau.
          </p>
        </header>

        {decks.length > 0 ? (
          <section className="panel mb-10">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-[var(--ink)]">À réviser aujourd&apos;hui</h2>
              <div className="flex items-center gap-3">
                <span className="count-badge" aria-label={`${totalDueCount} carte(s) à réviser`}>
                  {totalDueCount}
                </span>
                {totalDueCount > 0 ? (
                  <Link href="/decks/reviser" className="primary-button">
                    Réviser tout →
                  </Link>
                ) : null}
              </div>
            </div>

            {decksWithDueCount.length > 0 ? (
              <ul className="flex flex-col">
                {decksWithDueCount.map(({ deck, dueCount }) => (
                  <li key={deck.id} className="border-b border-[var(--line)]">
                    <Link
                      href={`/decks/${deck.id}`}
                      className="flex items-baseline justify-between gap-4 px-1 py-3 text-[var(--ink)] hover:bg-[var(--tint)]"
                    >
                      <span className="font-medium">{deck.name}</span>
                      <span className="mono text-sm text-[var(--accent-dark)]">{dueCount} à revoir →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Rien à réviser pour le moment dans tes {decks.length} deck(s).
              </p>
            )}
          </section>
        ) : null}

        <section className="panel">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-[var(--ink)]">Tous les decks</h2>
            <span className="mono text-xs text-[var(--muted)]">{decks.length} deck(s)</span>
          </div>

          <form onSubmit={(event) => void handleCreateDeck(event)} className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
              placeholder="Nom du nouveau deck"
              aria-label="Nom du deck"
              className="min-h-11 flex-1 border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
            />
            <button type="submit" disabled={isCreatingDeck} className="primary-button">
              {isCreatingDeck ? "Création..." : "Créer le deck"}
            </button>
          </form>

          {error ? (
            <p className="error-banner mb-4">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="skeleton h-32" />
              <div className="skeleton h-32" />
            </div>
          ) : decks.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {decks.map((deck, index) => {
                const dueCount = deck.cards.filter((card) => isCardDue(card.dueAt)).length;
                const upToDate = deck.cards.length - dueCount;

                return (
                  <div
                    key={deck.id}
                    className="token-card fade-in-up relative mb-0! flex flex-col gap-3"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <Link href={`/decks/${deck.id}`} className="block min-w-0 flex-1">
                        <span className="block truncate text-lg font-bold text-[var(--ink)]">{deck.name}</span>
                        <span className="mt-0.5 line-clamp-2 block text-sm text-[var(--muted)]">
                          {deck.description ?? "Deck de vocabulaire pour la pratique quotidienne."}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDeckPendingDeletion(deck);
                        }}
                        aria-label={`Supprimer le deck « ${deck.name} »`}
                        className="shrink-0 cursor-pointer rounded-full px-1.5 text-[var(--muted)] hover:text-[var(--accent-dark)]"
                      >
                        ✕
                      </button>
                    </div>

                    {deck.cards.length > 0 ? (
                      <div>
                        <div className="mb-1.5 flex items-baseline justify-between text-xs text-[var(--muted)]">
                          <span>
                            {upToDate} / {deck.cards.length} à jour
                          </span>
                          {dueCount > 0 ? (
                            <span className="font-semibold text-[var(--accent-dark)]">{dueCount} à revoir</span>
                          ) : (
                            <span className="font-semibold text-[var(--success-dark)]">Tout est à jour</span>
                          )}
                        </div>
                        <ProgressBar rate={upToDate / deck.cards.length} />
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--muted)]">Encore vide : ajoute des mots depuis Analyser.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="6" width="13" height="14" rx="2" />
                  <path d="M8 3h10a2 2 0 0 1 2 2v12" />
                </svg>
              </span>
              <p className="font-medium text-[var(--ink)]">Aucun deck pour le moment.</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Crée un deck puis ajoute-y des mots depuis la page Analyser.
              </p>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={deckPendingDeletion !== null}
        title="Supprimer ce deck ?"
        description={
          deckPendingDeletion
            ? `« ${deckPendingDeletion.name} » et ses ${deckPendingDeletion.cards.length} carte(s) seront supprimés définitivement.`
            : undefined
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          if (deckPendingDeletion) {
            void handleDeleteDeck(deckPendingDeletion.id);
          }
          setDeckPendingDeletion(null);
        }}
        onCancel={() => setDeckPendingDeletion(null)}
      />
    </main>
  );
}
