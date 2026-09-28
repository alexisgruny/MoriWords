"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { NoResults, ReferenceToolbar } from "@/components/reference-toolbar";
import { useToast } from "@/components/toast-provider";
import { filterKanji, JLPT_KANJI } from "@/lib/kanji/kanji";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";
import { jlptBadgeClass } from "@/lib/jlpt-badge";
import type { DeckSummary } from "@/types/shared";

const counts = Object.fromEntries(
  GRAMMAR_LEVELS.map((level) => [level, JLPT_KANJI.filter((entry) => entry.level === level).length]),
) as Record<GrammarLevel, number>;

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
      showToast("L'ajout au deck a échoué.", "error");
    } finally {
      setAddingKanji(null);
    }
  }

  const results = filterKanji(JLPT_KANJI, level, query);
  const visibleResults = results.slice(0, visibleCount);

  const deckControl =
    decks.length > 0 ? (
      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        Ajouter dans
        <select
          value={selectedDeckId}
          onChange={(event) => setSelectedDeckId(event.target.value)}
          aria-label="Deck de destination"
          className="min-h-9 cursor-pointer rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-sm text-[var(--ink)]"
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
    );

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="fade-in-up mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Référence</p>
            <h1 className="text-[var(--ink)]">Kanji par niveau JLPT</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Les kanji à connaître de N5 à N1, avec leurs lectures on&apos;yomi et
              kun&apos;yomi et leur sens. Choisis un niveau ou cherche un kanji, une
              lecture ou un sens.
            </p>
          </div>
          <Link href="/exercices/kanji" className="primary-button shrink-0">
            S&apos;exercer →
          </Link>
        </header>

        <section className="panel">
          <ReferenceToolbar
            level={level}
            onLevelChange={setLevel}
            counts={counts}
            total={JLPT_KANJI.length}
            query={query}
            onQueryChange={setQuery}
            placeholder="Rechercher un kanji, une lecture ou un sens (ex. 食, たべる, manger)"
            searchLabel="Rechercher un kanji"
            searchLang="ja"
            extra={deckControl}
          />

          <p className="mb-4 text-sm text-[var(--muted)]">{results.length} kanji</p>

          {visibleResults.length > 0 ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {visibleResults.map((entry) => {
                  const preferredReading = entry.kunReadings[0] ?? entry.onReadings[0] ?? "";
                  const isAdded = existingLemmas.has(entry.kanji);

                  return (
                    <div key={entry.kanji} className="token-card mb-0! flex gap-4">
                      <span
                        className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--tint)] text-5xl font-bold text-[var(--ink)]"
                        lang="ja"
                      >
                        {entry.kanji}
                      </span>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold leading-snug text-[var(--ink)]">{entry.meaning}</p>
                          <span className={`shrink-0 ${jlptBadgeClass(entry.level)}`}>{entry.level}</span>
                        </div>
                        {entry.onReadings.length > 0 ? (
                          <p className="mt-1.5 text-sm text-[var(--muted)]" lang="ja">
                            <span className="mr-1 text-xs font-semibold text-[var(--muted)]">On</span>
                            {entry.onReadings.join("・")}
                          </p>
                        ) : null}
                        {entry.kunReadings.length > 0 ? (
                          <p className="mt-0.5 text-sm text-[var(--muted)]" lang="ja">
                            <span className="mr-1 text-xs font-semibold text-[var(--muted)]">Kun</span>
                            {entry.kunReadings.join("・")}
                          </p>
                        ) : null}

                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          <span className="mono text-xs text-[var(--muted)]">{entry.strokeCount} trait{entry.strokeCount > 1 ? "s" : ""}</span>
                          {decks.length > 0 ? (
                            isAdded ? (
                              <span className="text-xs font-semibold text-[var(--success-dark)]">✓ Dans ce deck</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleAddToDeck(entry.kanji, preferredReading, entry.meaning)}
                                disabled={!selectedDeckId || addingKanji === entry.kanji}
                                className="chip px-3! py-1! text-xs!"
                              >
                                {addingKanji === entry.kanji ? "Ajout..." : "+ Ajouter"}
                              </button>
                            )
                          ) : null}
                        </div>
                      </div>
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
                    Charger plus ({results.length - visibleResults.length} restant
                    {results.length - visibleResults.length > 1 ? "s" : ""})
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <NoResults
              title="Aucun kanji ne correspond."
              onReset={() => {
                setLevel("all");
                setQuery("");
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
