"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { filterKanji, JLPT_KANJI } from "@/lib/kanji/kanji";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";
import type { DeckSummary } from "@/types/shared";

// Combien de kanji afficher avant d'exiger un clic sur "Charger plus" : le
// dataset est bien plus gros que grammaire/conjugaison (~2200 kanji, surtout
// concentrés en N1), donc tout rendre d'un coup alourdirait la page.
const PAGE_SIZE = 60;

// Page de référence de kanji : classés par niveau JLPT, avec filtre par
// niveau, recherche libre (kanji, lecture ou sens), pagination locale et un
// ajout direct au deck (même route que la page Analyser : POST .../cards,
// lemme = le kanji lui-même). L'exercice d'écriture associé vit sur sa
// propre sous-page (/exercices/kanji).
export default function KanjiPage() {
  const { showToast } = useToast();

  const [level, setLevel] = useState<GrammarLevel | "all">("N5");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [existingLemmas, setExistingLemmas] = useState<Set<string>>(new Set());
  const [addingKanji, setAddingKanji] = useState<string | null>(null);

  // Revient à la première page dès que le filtre change, sans passer par un
  // effet (juste une comparaison pendant le rendu, motif recommandé par React
  // pour réinitialiser un état dérivé d'une prop/valeur qui change).
  const [previousFilterKey, setPreviousFilterKey] = useState(`${level}|${query}`);
  const filterKey = `${level}|${query}`;
  if (filterKey !== previousFilterKey) {
    setPreviousFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  useEffect(() => {
    async function loadDecks() {
      try {
        const response = await fetch("/api/decks");
        const data: unknown = await response.json();

        if (response.ok && typeof data === "object" && data !== null && "decks" in data && Array.isArray(data.decks)) {
          const loaded = data.decks as DeckSummary[];
          setDecks(loaded);
          setSelectedDeckId((current) => current || loaded[0]?.id || "");
        }
      } catch {
        // Le sélecteur de deck restera vide ; l'utilisateur peut recharger la page.
      }
    }

    void loadDecks();
  }, []);

  // Sait quels kanji sont déjà dans le deck choisi, pour afficher "déjà dans
  // ce deck" plutôt que de laisser croire qu'un nouvel ajout est possible.
  useEffect(() => {
    if (!selectedDeckId) {
      return;
    }

    let cancelled = false;

    async function loadExistingLemmas() {
      try {
        const response = await fetch(`/api/decks/${selectedDeckId}/cards`);
        const data: unknown = await response.json();

        if (!cancelled && response.ok && typeof data === "object" && data !== null && "cards" in data && Array.isArray(data.cards)) {
          setExistingLemmas(new Set(data.cards.map((card) => (card as { lemma: string }).lemma)));
        }
      } catch {
        // Sans cette liste, un kanji déjà présent semble juste "pas encore ajouté" : sans gravité.
      }
    }

    void loadExistingLemmas();

    return () => {
      cancelled = true;
    };
  }, [selectedDeckId]);

  async function handleAddToDeck(kanji: string, reading: string, meaning: string) {
    if (!selectedDeckId) {
      return;
    }

    setAddingKanji(kanji);

    try {
      const response = await fetch(`/api/decks/${selectedDeckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lemma: kanji, reading, meaning }),
      });

      if (!response.ok) {
        throw new Error("add failed");
      }

      setExistingLemmas((current) => new Set(current).add(kanji));
      showToast(`« ${kanji} » ajouté au deck.`);
    } catch {
      showToast("L’ajout au deck a échoué.", "error");
    } finally {
      setAddingKanji(null);
    }
  }

  const results = filterKanji(JLPT_KANJI, level, query);
  const visibleResults = results.slice(0, visibleCount);
  const countFor = (candidate: GrammarLevel) => JLPT_KANJI.filter((entry) => entry.level === candidate).length;

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[var(--ink)]">Kanji par niveau JLPT</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Les kanji à connaître de N5 à N1, avec leurs lectures on&apos;yomi et
              kun&apos;yomi et leur sens. Choisis un niveau ou cherche un kanji, une
              lecture ou un sens.
            </p>
          </div>
          <Link href="/exercices/kanji" className="secondary-button shrink-0">
            S&apos;exercer
          </Link>
        </header>

        <section className="panel">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Niveau JLPT">
              <button
                type="button"
                onClick={() => setLevel("all")}
                aria-pressed={level === "all"}
                className={`rounded-sm border px-3.5 py-1.5 text-sm font-medium transition ${
                  level === "all"
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                    : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
                }`}
              >
                Tous ({JLPT_KANJI.length})
              </button>
              {GRAMMAR_LEVELS.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setLevel(candidate)}
                  aria-pressed={level === candidate}
                  className={`rounded-sm border px-3.5 py-1.5 text-sm font-medium transition ${
                    level === candidate
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                      : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
                  }`}
                >
                  {candidate} ({countFor(candidate)})
                </button>
              ))}
            </div>

            {decks.length > 0 ? (
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                Ajouter dans
                <select
                  value={selectedDeckId}
                  onChange={(event) => setSelectedDeckId(event.target.value)}
                  aria-label="Deck de destination"
                  className="min-h-9 rounded-sm border border-[var(--line-strong)] bg-[var(--paper)] px-2 py-1 text-sm text-[var(--ink)]"
                >
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                <Link href="/decks" className="link-button text-sm!">
                  Crée un deck
                </Link>{" "}
                pour pouvoir ajouter des kanji.
              </p>
            )}
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un kanji, une lecture ou un sens (ex. 食, たべる, manger)"
            aria-label="Rechercher un kanji"
            lang="ja"
            className="mb-6 min-h-11 w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
          />

          <p className="mb-4 text-sm text-[var(--muted)]">{results.length} kanji</p>

          {visibleResults.length > 0 ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {visibleResults.map((entry) => {
                  const preferredReading = entry.kunReadings[0] ?? entry.onReadings[0] ?? "";
                  const isAdded = existingLemmas.has(entry.kanji);

                  return (
                    <div key={entry.kanji} className="token-card">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-3xl font-bold text-[var(--ink)]" lang="ja">
                          {entry.kanji}
                        </span>
                        <span className="shrink-0 whitespace-nowrap rounded-sm border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 mono text-xs text-[var(--ink)]">
                          JLPT {entry.level}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-[var(--ink)]">{entry.meaning}</p>
                      {entry.onReadings.length > 0 ? (
                        <p className="mt-2 text-sm text-[var(--muted)]" lang="ja">
                          <span className="eyebrow">On</span> {entry.onReadings.join("・")}
                        </p>
                      ) : null}
                      {entry.kunReadings.length > 0 ? (
                        <p className="mt-1 text-sm text-[var(--muted)]" lang="ja">
                          <span className="eyebrow">Kun</span> {entry.kunReadings.join("・")}
                        </p>
                      ) : null}

                      {decks.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => void handleAddToDeck(entry.kanji, preferredReading, entry.meaning)}
                          disabled={!selectedDeckId || addingKanji === entry.kanji || isAdded}
                          className="mt-3 rounded-sm border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-soft)] disabled:opacity-55"
                        >
                          {isAdded ? "Déjà dans ce deck" : addingKanji === entry.kanji ? "Ajout..." : "Ajouter au deck"}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {results.length > visibleResults.length ? (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                    className="secondary-button"
                  >
                    Charger plus ({results.length - visibleResults.length} restant(s))
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state min-h-48">
              <p className="font-medium text-[var(--ink)]">Aucun kanji ne correspond.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Essaie un autre niveau ou un autre mot-clé.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
