"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FilterChips, SearchField } from "@/components/reference-toolbar";
import { jlptBadgeClass } from "@/lib/jlpt-badge";
import { translatePartOfSpeech } from "@/lib/tokenizer/part-of-speech-labels";
import type { DeckSummary, VocabularyEntry } from "@/types/shared";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";

const LEVELS: LevelFilter[] = ["all", "N5", "N4", "N3", "N2", "N1"];

// Page qui affiche tout le vocabulaire rencontré, avec un filtre par niveau
// JLPT et une recherche.
export default function VocabularyPage() {
  const [vocabularyEntries, setVocabularyEntries] = useState<VocabularyEntry[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<LevelFilter>("all");
  const [query, setQuery] = useState("");
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  // Sans cet état, "Aucun mot pour le moment" s'affichait avant l'arrivée
  // de la liste.
  const [isLoading, setIsLoading] = useState(true);

  // La liste des mots déjà présents dans au moins un deck, pour le badge "Déjà ajouté".
  const addedLemmas = new Set(decks.flatMap((deck) => deck.cards.map((card) => card.lemma)));

  const levelOf = (entry: VocabularyEntry) => entry.difficulty ?? "N5";
  const normalizedQuery = query.trim().toLowerCase();
  const filteredVocabularyEntries = vocabularyEntries.filter(
    (entry) =>
      (selectedDifficulty === "all" || levelOf(entry) === selectedDifficulty) &&
      (!normalizedQuery ||
        [entry.lemma, entry.reading].some((value) => value?.toLowerCase().includes(normalizedQuery))),
  );

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
      } finally {
        setIsLoading(false);
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

  const levelOptions = LEVELS.map((level) => ({
    value: level,
    label: level === "all" ? "Tous" : level,
    count: level === "all" ? vocabularyEntries.length : vocabularyEntries.filter((entry) => levelOf(entry) === level).length,
  }));

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="fade-in-up mb-8">
          <p className="eyebrow mb-1">Ton vocabulaire</p>
          <h1 className="text-[var(--ink)]">Vocabulaire global</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Tous les mots rencontrés dans les textes que tu as analysés, avec le nombre de fois où tu les as croisés.
          </p>
        </header>

        <section className="panel">
          <div className="mb-3">
            <FilterChips options={levelOptions} value={selectedDifficulty} onChange={setSelectedDifficulty} label="Niveau JLPT" />
          </div>
          <div className="mb-4">
            <SearchField value={query} onChange={setQuery} placeholder="Rechercher un mot ou une lecture" label="Rechercher un mot" lang="ja" />
          </div>

          <p className="mb-4 text-sm text-[var(--muted)]">
            {filteredVocabularyEntries.length} mot{filteredVocabularyEntries.length > 1 ? "s" : ""}
          </p>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="skeleton h-28" />
              ))}
            </div>
          ) : filteredVocabularyEntries.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredVocabularyEntries.map((entry) => (
                <div key={entry.lemma} className="token-card mb-0!">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--muted)]" lang="ja">
                        {entry.reading ?? "lecture inconnue"}
                      </p>
                      <p className="text-2xl font-bold leading-tight text-[var(--ink)]" lang="ja">
                        {entry.lemma}
                      </p>
                    </div>
                    <span className={`shrink-0 ${jlptBadgeClass(entry.difficulty)}`}>
                      {entry.difficulty === "unknown" ? "—" : (entry.difficulty ?? "—")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="part-of-speech">{translatePartOfSpeech(entry.partOfSpeech) || "—"}</span>
                    <span>
                      vu <strong className="mono text-[var(--ink)]">{entry.occurrenceCount}</strong> fois
                    </span>
                    {addedLemmas.has(entry.lemma) ? (
                      <span className="ml-auto font-semibold text-[var(--success-dark)]">✓ Dans un deck</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : vocabularyEntries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                <span lang="ja">語</span>
              </span>
              <p className="font-medium text-[var(--ink)]">Aucun mot pour le moment.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <Link href="/" className="link-button text-sm!">
                  Analyse un texte
                </Link>{" "}
                pour commencer à construire ton vocabulaire.
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <p className="font-medium text-[var(--ink)]">Aucun mot ne correspond.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDifficulty("all");
                    setQuery("");
                  }}
                  className="link-button text-sm!"
                >
                  Réinitialiser les filtres
                </button>
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
