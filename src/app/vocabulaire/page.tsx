"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FilterChips, SearchField } from "@/components/reference-toolbar";
import { SpeakButton } from "@/components/speak-button";
import { jlptBadgeClass } from "@/lib/jlpt-badge";
import { translatePartOfSpeech } from "@/lib/tokenizer/part-of-speech-labels";
import type { DeckSummary, VocabularyEntry } from "@/types/shared";

type LevelFilter = "all" | "N5" | "N4" | "N3" | "N2" | "N1";

const GRAMMAR_WORD_CATEGORIES = new Set(["助詞", "助動詞"]);
const KANA = /[\u3040-\u30ff]/;

// La lecture enregistrée est celle de la forme rencontrée dans le texte
// (がんばろ pour 頑張る) : si elle ne se termine pas par le même kana que le
// mot, elle est fausse pour la forme du dictionnaire, on ne l'affiche pas.
function readingOfLemma(lemma: string, reading?: string | null): string | null {
  if (!reading) {
    return null;
  }
  const last = lemma.slice(-1);
  return KANA.test(last) && reading.slice(-1) !== last ? null : reading;
}

const LEVELS: LevelFilter[] = ["all", "N5", "N4", "N3", "N2", "N1"];

// Page qui affiche tout le vocabulaire rencontré, avec un filtre par niveau
// JLPT et une recherche.
export default function VocabularyPage() {
  const [vocabularyEntries, setVocabularyEntries] = useState<VocabularyEntry[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<LevelFilter>("all");
  const [query, setQuery] = useState("");
  // Particules et auxiliaires (は, を, ます, ない…) cachés par défaut : ce sont
  // les mots les plus fréquents, ils masquaient le vrai vocabulaire.
  const [showGrammarWords, setShowGrammarWords] = useState(false);
  // Mot ouvert (sens affiché) et sens déjà chargés.
  const [openedLemma, setOpenedLemma] = useState<string | null>(null);
  const [meanings, setMeanings] = useState<Record<string, string | null>>({});
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  // Sans cet état, "Aucun mot pour le moment" s'affichait avant l'arrivée
  // de la liste.
  const [isLoading, setIsLoading] = useState(true);

  // La liste des mots déjà présents dans au moins un deck, pour le badge "Déjà ajouté".
  const addedLemmas = new Set(decks.flatMap((deck) => deck.cards.map((card) => card.lemma)));

  const levelOf = (entry: VocabularyEntry) => entry.difficulty ?? "N5";
  const baseEntries = showGrammarWords
    ? vocabularyEntries
    : vocabularyEntries.filter((entry) => !GRAMMAR_WORD_CATEGORIES.has(entry.partOfSpeech ?? ""));

  // Touche un mot : son sens (traduction partagée par mot, souvent déjà en
  // cache, donc sans appel à Claude) ; le retoucher le referme.
  async function toggleMeaning(lemma: string) {
    if (openedLemma === lemma) {
      setOpenedLemma(null);
      return;
    }
    setOpenedLemma(lemma);
    if (lemma in meanings) {
      return;
    }
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lemma }),
      });
      const data = (await response.json()) as { result?: { translation?: string } };
      setMeanings((current) => ({ ...current, [lemma]: response.ok ? (data.result?.translation ?? null) : null }));
    } catch {
      setMeanings((current) => ({ ...current, [lemma]: null }));
    }
  }
  const normalizedQuery = query.trim().toLowerCase();
  const filteredVocabularyEntries = baseEntries.filter(
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
    count: level === "all" ? baseEntries.length : baseEntries.filter((entry) => levelOf(entry) === level).length,
  }));

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="fade-in-up mb-8">
          <h1 className="text-[var(--ink)]">Mon vocabulaire</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Les mots de tes textes analysés, des plus vus aux plus rares. Touche un mot pour voir son sens.
          </p>
        </header>

        <section className="panel">
          <div className="mb-3">
            <FilterChips options={levelOptions} value={selectedDifficulty} onChange={setSelectedDifficulty} label="Niveau JLPT" />
          </div>
          <div className="mb-4">
            <SearchField value={query} onChange={setQuery} placeholder="Rechercher un mot ou une lecture" label="Rechercher un mot" lang="ja" />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--muted)]">
              {filteredVocabularyEntries.length} mot{filteredVocabularyEntries.length > 1 ? "s" : ""}
            </p>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--muted)]">
              <input
                type="checkbox"
                checked={showGrammarWords}
                onChange={(event) => setShowGrammarWords(event.target.checked)}
                className="accent-[var(--accent)]"
              />
              Voir は, を, ます…
            </label>
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="skeleton h-28" />
              ))}
            </div>
          ) : filteredVocabularyEntries.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredVocabularyEntries.map((entry) => {
                const reading = readingOfLemma(entry.lemma, entry.reading);
                const isOpened = openedLemma === entry.lemma;
                return (
                <div key={entry.lemma} className={`token-card mb-0! ${isOpened ? "token-card-selected" : ""}`}>
                  <button
                    type="button"
                    onClick={() => void toggleMeaning(entry.lemma)}
                    aria-expanded={isOpened}
                    className="flex w-full cursor-pointer items-start justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--muted)]" lang="ja">
                        {reading ?? "\u00a0"}
                      </p>
                      <p className="text-2xl font-bold leading-tight text-[var(--ink)]" lang="ja">
                        {entry.lemma}
                      </p>
                    </div>
                    <span className={`shrink-0 ${jlptBadgeClass(entry.difficulty)}`}>
                      {entry.difficulty === "unknown" ? "—" : (entry.difficulty ?? "—")}
                    </span>
                  </button>
                  {isOpened ? (
                    <div className="fade-in-up mt-2 flex items-center gap-2 border-l-4 border-[var(--accent)] pl-3">
                      <p className="min-w-0 flex-1 font-semibold text-[var(--ink)]">
                        {entry.lemma in meanings ? (meanings[entry.lemma] ?? "Sens indisponible pour le moment.") : "…"}
                      </p>
                      <SpeakButton text={reading ?? entry.lemma} label="Écouter" size="sm" />
                    </div>
                  ) : null}
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
                );
              })}
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
