"use client";

import { useEffect, useState } from "react";

import { translatePartOfSpeech } from "@/lib/tokenizer/part-of-speech-labels";
import type { DeckSummary, VocabularyEntry } from "@/types/shared";

// Page qui affiche tout le vocabulaire rencontré, avec un filtre par niveau JLPT.
export default function VocabularyPage() {
  const [vocabularyEntries, setVocabularyEntries] = useState<VocabularyEntry[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "N5" | "N4" | "N3" | "N2" | "N1">("all");
  const [decks, setDecks] = useState<DeckSummary[]>([]);

  // La liste des mots déjà présents dans au moins un deck, pour le badge "Déjà ajouté".
  const addedLemmas = new Set(decks.flatMap((deck) => deck.cards.map((card) => card.lemma)));

  // N'affiche que les mots du niveau JLPT sélectionné (ou tous si "all").
  const filteredVocabularyEntries = selectedDifficulty === "all"
    ? vocabularyEntries
    : vocabularyEntries.filter((entry) => (entry.difficulty ?? "N5") === selectedDifficulty);

  // Charge le vocabulaire et les decks (pour le badge) dès l'affichage de la page.
  useEffect(() => {
    async function loadVocabulary() {
      try {
        const response = await fetch("/api/vocabulary");
        const data: unknown = await response.json();

        if (
          response.ok &&
          typeof data === "object" &&
          data !== null &&
          "entries" in data &&
          Array.isArray(data.entries)
        ) {
          setVocabularyEntries(data.entries as VocabularyEntry[]);
        }
      } catch {
        // The vocabulary list can be refreshed again later.
      }
    }

    async function loadDecks() {
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
        // The badge is optional.
      }
    }

    void loadVocabulary();
    void loadDecks();
  }, []);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-[var(--ink)]">
            Vocabulaire global
          </h1>
        </header>

        <section className="panel">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-[var(--ink)]">
                Mots analysés
              </h2>
            <span className="text-sm text-[var(--muted)]">{filteredVocabularyEntries.length} mots</span>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {(["all", "N5", "N4", "N3", "N2", "N1"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedDifficulty(level)}
                className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
                  selectedDifficulty === level
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                    : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
                }`}
              >
                {level === "all" ? "Tous" : level}
              </button>
            ))}
          </div>

          {filteredVocabularyEntries.length > 0 ? (
            <div className="grid md:grid-cols-2 md:gap-x-10 xl:grid-cols-3">
              {filteredVocabularyEntries.map((entry) => (
                <div key={`${entry.lemma}-${entry.occurrenceCount}`} className="token-card">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-[var(--ink)]" lang="ja">
                      {entry.lemma}
                    </span>
                    <span className="count-badge">{entry.occurrenceCount}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-sm text-[var(--muted)]">
                    <span>{entry.reading ?? "lecture inconnue"}</span>
                    <span className="mono">{entry.difficulty === "unknown" ? "—" : (entry.difficulty ?? "—")}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                    <span>{translatePartOfSpeech(entry.partOfSpeech) || "—"}</span>
                    {addedLemmas.has(entry.lemma) ? (
                      <span className="rounded-sm border border-[var(--line)] bg-[var(--accent-soft)] px-2 py-0.5 font-medium text-[var(--ink)]">
                        Déjà ajouté
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="font-medium text-[var(--ink)]">Aucun mot pour le moment.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Analyse un texte depuis la page Analyser pour commencer à construire ton vocabulaire.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
