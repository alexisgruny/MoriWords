"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { useToast } from "@/components/toast-provider";
import type { DeckSummary } from "@/types/shared";

// Page qui liste tous les decks de l'utilisateur et permet d'en créer un nouveau.
export default function DecksPage() {
  const { showToast } = useToast();
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [deckName, setDeckName] = useState("Mon deck japonais");
  const [error, setError] = useState<string | null>(null);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

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

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="eyebrow">MoriWords / Decks</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            Tes decks de vocabulaire
          </h1>
        </header>

        <section className="panel p-6 sm:p-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Decks</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                Cartes de vocabulaire
              </h2>
            </div>
            <span className="text-sm text-[var(--muted)]">{decks.length} deck(s)</span>
          </div>

          <form onSubmit={(event) => void handleCreateDeck(event)} className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
              placeholder="Nom du deck"
              aria-label="Nom du deck"
              className="min-h-12 flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
            />
            <button type="submit" disabled={isCreatingDeck} className="primary-button">
              {isCreatingDeck ? "Création..." : "Créer le deck"}
            </button>
          </form>

          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {decks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {decks.map((deck) => (
                <Link key={deck.id} href={`/decks/${deck.id}`} className="token-card block text-left">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-[var(--ink)]">{deck.name}</span>
                    <span className="count-badge">{deck.cards.length}</span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {deck.description ?? "Deck de vocabulaire pour la pratique quotidienne."}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="font-medium text-[var(--ink)]">Aucun deck pour le moment.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Crée un deck puis ajoute-y quelques mots sélectionnés depuis la page Analyser.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
