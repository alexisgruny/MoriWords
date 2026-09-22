"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import type { DeckCardWithOccurrences, DeckStats, DeckSummary } from "@/types/shared";

type ReviewMode = "standard" | "kanji" | "context";

const reviewModes: Array<{ id: ReviewMode; label: string }> = [
  { id: "standard", label: "Standard" },
  { id: "kanji", label: "Kanji" },
  { id: "context", label: "Contexte" },
];

// Met en évidence le lemme dans la phrase de contexte sans injecter de HTML brut.
function highlightLemma(sentence: string, lemma: string): ReactNode {
  if (!lemma || !sentence.includes(lemma)) {
    return sentence;
  }

  const parts = sentence.split(lemma);

  return parts.flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <strong key={`highlight-${index}`} className="text-[var(--accent)]">
            {lemma}
          </strong>,
          part,
        ],
  );
}

export default function DeckDetailPage() {
  const params = useParams<{ deckId: string }>();
  const deckId = params.deckId;

  const [deck, setDeck] = useState<DeckSummary | null>(null);
  const [deckCards, setDeckCards] = useState<DeckCardWithOccurrences[]>([]);
  const [deckStats, setDeckStats] = useState<DeckStats | null>(null);
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [reviewCardId, setReviewCardId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("standard");
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const normalizedCardSearch = cardSearchQuery.trim().toLowerCase();
  const filteredDeckCards = normalizedCardSearch
    ? deckCards.filter((card) =>
        [card.lemma, card.reading, card.meaning]
          .filter((value): value is string => typeof value === "string")
          .some((value) => value.toLowerCase().includes(normalizedCardSearch)),
      )
    : deckCards;

  useEffect(() => {
    void loadDeck();
    void loadDeckCards();
    void loadDeckStats();
    // loadDeck/loadDeckCards/loadDeckStats close over deckId and are also
    // called after mutations (delete, review) below; only re-run on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  async function loadDeck() {
    try {
      const response = await fetch(`/api/decks/${deckId}`);
      const data: unknown = await response.json();

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (
        response.ok &&
        typeof data === "object" &&
        data !== null &&
        "deck" in data &&
        typeof data.deck === "object" &&
        data.deck !== null
      ) {
        setDeck(data.deck as DeckSummary);
      }
    } catch {
      // The deck header can be refreshed again later.
    }
  }

  async function loadDeckCards() {
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`);
      const data: unknown = await response.json();

      if (
        response.ok &&
        typeof data === "object" &&
        data !== null &&
        "cards" in data &&
        Array.isArray(data.cards)
      ) {
        setDeckCards(data.cards as DeckCardWithOccurrences[]);
      }
    } catch {
      // The card list can be refreshed again later.
    }
  }

  async function loadDeckStats() {
    try {
      const response = await fetch(`/api/decks/${deckId}/stats`);
      const data: unknown = await response.json();

      if (response.ok && typeof data === "object" && data !== null && !("error" in data)) {
        setDeckStats(data as DeckStats);
      }
    } catch {
      // Stats are optional and can be refreshed again later.
    }
  }

  async function handleDeleteCard(cardId: string) {
    try {
      const response = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
        method: "DELETE",
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de supprimer la carte");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      await Promise.all([loadDeck(), loadDeckCards(), loadDeckStats()]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la suppression de la carte.",
      );
    }
  }

  async function submitReviewCard(cardId: string, quality: number) {
    setReviewCardId(cardId);
    setIsReviewing(true);
    setError(null);

    try {
      const response = await fetch(`/api/decks/${deckId}/cards/${cardId}/review`, {
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

      await Promise.all([loadDeck(), loadDeckStats()]);
      setReviewCardId(null);
      setShowAnswer(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la révision.",
      );
    } finally {
      setIsReviewing(false);
    }
  }

  if (notFound) {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="empty-state">
            <p className="font-medium text-[var(--ink)]">Deck introuvable.</p>
            <Link href="/decks" className="mt-4 primary-button">
              Retour aux decks
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const sortedCards = deck
    ? [...deck.cards].sort((a, b) => {
        const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      })
    : [];

  const dueCards = sortedCards.filter((card) => {
    if (!card.dueAt) {
      return true;
    }

    return new Date(card.dueAt).getTime() <= Date.now();
  });

  const activeCard = dueCards[0];

  const activeCardOccurrences = activeCard
    ? deckCards.find((card) => card.id === activeCard.id)?.occurrences ?? []
    : [];
  const activeCardContextSentence = activeCardOccurrences.find(
    (occurrence) => occurrence.sourceText !== null,
  )?.sourceText?.content ?? null;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/decks" className="eyebrow">
              ← Decks
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
              {deck?.name ?? "Deck"}
            </h1>
          </div>
          <a
            href={`/api/decks/${deckId}/export/anki`}
            download
            className="secondary-button"
          >
            Exporter vers Anki
          </a>
        </header>

        {error ? (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section className="panel p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Daily review</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">Révision du deck</h2>
            </div>
            <span className="count-badge">{dueCards.length}</span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
              Total: {deck?.cards.length ?? 0}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
              Due today: {dueCards.length}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
              Nouveau: {Math.max(0, (deck?.cards.length ?? 0) - dueCards.length)}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {reviewModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setReviewMode(mode.id);
                  setShowAnswer(false);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  reviewMode === mode.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {activeCard ? (
            <>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
                {reviewMode === "context" ? (
                  activeCardContextSentence ? (
                    <>
                      <p className="text-sm text-[var(--muted)]">Phrase à comprendre</p>
                      <p className="mt-2 text-xl leading-8 text-[var(--ink)]" lang="ja">
                        {highlightLemma(activeCardContextSentence, activeCard.lemma)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--muted)]">
                        Aucun contexte disponible pour ce mot — mode kanji utilisé à la place
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-[var(--ink)]" lang="ja">
                        {activeCard.lemma}
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <p className="text-sm text-[var(--muted)]">Mot à revoir</p>
                    <p className="mt-2 text-3xl font-semibold text-[var(--ink)]" lang="ja">
                      {activeCard.lemma}
                    </p>
                    {reviewMode === "standard" ? (
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {activeCard.reading ?? "lecture inconnue"}
                      </p>
                    ) : null}
                  </>
                )}

                {showAnswer ? (
                  <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--background)] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent)]">Réponse</p>
                    {reviewMode !== "standard" ? (
                      <p className="mt-2 text-lg text-[var(--ink)]" lang="ja">
                        {activeCard.lemma} · {activeCard.reading ?? "lecture inconnue"}
                      </p>
                    ) : null}
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
                  <>
                    {[0, 1, 2, 3, 4, 5].map((quality) => {
                      const labels = ["Encore", "Difficile", "Ok", "Bien", "Très bien", "Parfait"];
                      return (
                        <button
                          key={quality}
                          type="button"
                          onClick={() => void submitReviewCard(activeCard.id, quality)}
                          disabled={isReviewing && reviewCardId === activeCard.id}
                          className="primary-button"
                        >
                          {labels[quality]}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state min-h-48">
              <p className="font-medium text-[var(--ink)]">Aucune carte à revoir aujourd’hui.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Ajoute de nouveaux mots depuis la page Analyser ou reviens plus tard.
              </p>
            </div>
          )}
        </section>

        {deckStats ? (
          <section className="mt-8 panel p-6 sm:p-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Progress</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Statistiques du deck
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
                Total cartes : {deckStats.totalCards}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
                Cartes dues : {deckStats.dueCards}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
                Révisions totales : {deckStats.totalReviews}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
                Taux de réussite :{" "}
                {deckStats.successRate === null
                  ? "—"
                  : `${Math.round(deckStats.successRate * 100)}%`}
              </span>
            </div>

            {deckStats.recentReviews.length > 0 ? (
              <div className="mt-5">
                <p className="eyebrow">Historique</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {deckStats.recentReviews.map((review) => (
                    <li
                      key={review.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm"
                    >
                      <span className="text-[var(--ink)]" lang="ja">{review.lemma}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(review.reviewedAt).toLocaleString("fr-FR")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          review.quality >= 3
                            ? "bg-[var(--accent-soft)] text-[var(--ink)]"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {review.quality}/5
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted)]">
                Aucune révision enregistrée pour ce deck pour le moment.
              </p>
            )}
          </section>
        ) : null}

        <section className="mt-8 panel p-6 sm:p-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Manage</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Cartes du deck</h2>
            </div>
            <span className="text-sm text-[var(--muted)]">{filteredDeckCards.length} carte(s)</span>
          </div>

          <input
            value={cardSearchQuery}
            onChange={(event) => setCardSearchQuery(event.target.value)}
            placeholder="Rechercher une carte (mot, lecture, sens)"
            aria-label="Rechercher une carte"
            className="mb-5 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
          />

          {filteredDeckCards.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredDeckCards.map((card) => (
                <div key={card.id} className="token-card">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-[var(--ink)]" lang="ja">
                      {card.lemma}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCard(card.id)}
                      className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {card.reading ?? "lecture inconnue"} · {card.meaning ?? "sens à compléter"}
                  </p>
                  {card.occurrences.length > 0 ? (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Vu dans {card.occurrences.length} texte(s)
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="font-medium text-[var(--ink)]">
                {cardSearchQuery ? "Aucune carte ne correspond à la recherche." : "Aucune carte dans ce deck pour le moment."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
