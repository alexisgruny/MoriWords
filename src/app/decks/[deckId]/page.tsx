"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { buildQuizChoices } from "@/lib/decks/card-utils";
import type { DeckCard, DeckCardWithOccurrences, DeckStats, DeckSummary } from "@/types/shared";

// Les façons de présenter une carte pendant la révision : le mode standard
// montre le kanji et sa lecture, le mode kanji ne montre que le kanji, le
// mode contexte montre une phrase où le mot est apparu, et le mode quiz
// propose 4 choix de sens au lieu d'une auto-évaluation.
type ReviewMode = "standard" | "kanji" | "context" | "quiz";

// La liste des modes affichés dans le sélecteur, avec leur libellé.
const reviewModes: Array<{ id: ReviewMode; label: string }> = [
  { id: "standard", label: "Standard" },
  { id: "kanji", label: "Kanji" },
  { id: "context", label: "Contexte" },
  { id: "quiz", label: "Quiz" },
];

// Note de qualité SM-2 (0-5) envoyée automatiquement selon la réponse au
// quiz : plus indulgent qu'un échec total puisque reconnaître un sens parmi
// 4 choix est plus facile qu'un rappel libre, mais loin du score max.
const QUIZ_CORRECT_QUALITY = 4;
const QUIZ_INCORRECT_QUALITY = 1;

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
          <strong key={`highlight-${index}`} className="text-[var(--accent-dark)]">
            {lemma}
          </strong>,
          part,
        ],
  );
}

// Page de détail d'un deck : révision des cartes dues (avec 3 modes
// d'entraînement), statistiques et gestion des cartes (recherche, suppression).
export default function DeckDetailPage() {
  const params = useParams<{ deckId: string }>();
  const deckId = params.deckId;
  const router = useRouter();
  const { showToast } = useToast();

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
  const [cardPendingDeletion, setCardPendingDeletion] = useState<DeckCardWithOccurrences | null>(null);
  const [isDeckDeletionPending, setIsDeckDeletionPending] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [quizChoices, setQuizChoices] = useState<string[]>([]);
  const [selectedQuizChoice, setSelectedQuizChoice] = useState<string | null>(null);
  const [isLoadingQuizChoices, setIsLoadingQuizChoices] = useState(false);

  // Filtre les cartes affichées selon la recherche (mot, lecture ou sens).
  const normalizedCardSearch = cardSearchQuery.trim().toLowerCase();
  const filteredDeckCards = normalizedCardSearch
    ? deckCards.filter((card) =>
        [card.lemma, card.reading, card.meaning]
          .filter((value): value is string => typeof value === "string")
          .some((value) => value.toLowerCase().includes(normalizedCardSearch)),
      )
    : deckCards;

  // Charge le deck, ses cartes et ses statistiques à chaque changement de deck.
  useEffect(() => {
    void loadDeck();
    void loadDeckCards();
    void loadDeckStats();
    // loadDeck/loadDeckCards/loadDeckStats close over deckId and are also
    // called after mutations (delete, review) below; only re-run on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Va chercher les informations du deck (nom, cartes) sur le serveur.
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

  // Va chercher les cartes du deck avec leurs occurrences (textes source), pour
  // la gestion des cartes et le mode d'entraînement "Contexte".
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

  // Va chercher les statistiques de révision du deck.
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

  // Supprime une carte du deck et rafraîchit l'affichage.
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
      showToast("Carte supprimée.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la suppression de la carte.",
      );
      showToast("La suppression de la carte a échoué.", "error");
    }
  }

  // Supprime le deck entier (et ses cartes) puis retourne à la liste des decks.
  async function handleDeleteDeck() {
    setIsDeletingDeck(true);

    try {
      const response = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de supprimer le deck");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      showToast("Deck supprimé.");
      router.push("/decks");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la suppression du deck.",
      );
      showToast("La suppression du deck a échoué.", "error");
      setIsDeletingDeck(false);
    }
  }

  // Envoie la note de révision (0 à 5) choisie par l'utilisateur pour une
  // carte, puis passe à la carte due suivante.
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
      showToast("Révision enregistrée.");
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

  // Trie les cartes par date d'échéance, les plus en retard en premier.
  const sortedCards = deck
    ? [...deck.cards].sort((a, b) => {
        const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      })
    : [];

  // Ne garde que les cartes dont la date de révision est passée (ou jamais révisées).
  const dueCards = sortedCards.filter((card) => {
    if (!card.dueAt) {
      return true;
    }

    return new Date(card.dueAt).getTime() <= Date.now();
  });

  // La carte actuellement proposée en révision (la plus urgente).
  const activeCard = dueCards[0];

  // Cherche une phrase où la carte active est apparue, pour le mode "Contexte".
  const activeCardOccurrences = activeCard
    ? deckCards.find((card) => card.id === activeCard.id)?.occurrences ?? []
    : [];
  const activeCardContextSentence = activeCardOccurrences.find(
    (occurrence) => occurrence.sourceText !== null,
  )?.sourceText?.content ?? null;

  // Charge les choix du mode quiz dès qu'on l'active ou que la carte due change.
  useEffect(() => {
    if (reviewMode !== "quiz" || !activeCard) {
      return;
    }

    void loadQuizChoices(activeCard);
    // deckCards fournit le pool de leurres "même deck" ; loadQuizChoices lit
    // la valeur actuelle via la fermeture, pas besoin de plus de dépendances.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewMode, activeCard?.id, activeCard?.meaning, deckCards]);

  // Charge les choix du mode quiz pour une carte : la bonne réponse et
  // jusqu'à 3 leurres, d'abord pris parmi les autres mots déjà traduits du
  // deck, complétés si besoin depuis le cache de traduction global (jamais
  // d'appel à Claude, donc jamais bloquant ni coûteux).
  async function loadQuizChoices(card: DeckCard) {
    setSelectedQuizChoice(null);
    // Vide tout de suite les anciens choix pour ne jamais afficher les
    // options d'une carte précédente pendant le chargement des nouvelles.
    setQuizChoices([]);

    if (!card.meaning) {
      return;
    }

    setIsLoadingQuizChoices(true);

    try {
      let pool = Array.from(
        new Set(
          deckCards
            .filter((other) => other.id !== card.id && other.meaning)
            .map((other) => other.meaning as string),
        ),
      );

      if (pool.length < 3) {
        const exclude = [card.meaning, ...pool].join("|");
        const response = await fetch(
          `/api/translate/distractors?exclude=${encodeURIComponent(exclude)}&count=${3 - pool.length}`,
        );
        const data: unknown = await response.json();

        if (
          response.ok &&
          typeof data === "object" &&
          data !== null &&
          "translations" in data &&
          Array.isArray(data.translations)
        ) {
          pool = [...pool, ...(data.translations as string[])];
        }
      }

      setQuizChoices(buildQuizChoices(card.meaning, pool));
    } catch {
      // Le quiz reste vide ; l'utilisateur peut changer de mode de révision.
      setQuizChoices([]);
    } finally {
      setIsLoadingQuizChoices(false);
    }
  }

  // Répond au quiz : détermine si le choix est correct, l'affiche brièvement,
  // puis envoie la note SM-2 correspondante et passe à la carte suivante.
  function handleQuizAnswer(card: DeckCard, choice: string) {
    if (selectedQuizChoice) {
      return;
    }

    setSelectedQuizChoice(choice);

    const quality = choice === card.meaning ? QUIZ_CORRECT_QUALITY : QUIZ_INCORRECT_QUALITY;

    setTimeout(() => {
      void submitReviewCard(card.id, quality);
    }, 1100);
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
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/decks/${deckId}/export/anki`}
              download
              className="secondary-button"
            >
              Exporter vers Anki
            </a>
            <button
              type="button"
              onClick={() => setIsDeckDeletionPending(true)}
              className="secondary-button text-red-700 hover:bg-red-50"
            >
              Supprimer le deck
            </button>
          </div>
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
                    {reviewMode === "standard" || reviewMode === "quiz" ? (
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {activeCard.reading ?? "lecture inconnue"}
                      </p>
                    ) : null}
                  </>
                )}

                {reviewMode !== "quiz" && showAnswer ? (
                  <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--background)] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent-dark)]">Réponse</p>
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
                {reviewMode === "quiz" ? (
                  !activeCard.meaning ? (
                    <p className="text-sm text-[var(--muted)]">
                      Ce mot n’a pas encore de sens enregistré — traduis-le ou utilise un autre
                      mode pour le réviser.
                    </p>
                  ) : quizChoices.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">
                      {isLoadingQuizChoices ? "Préparation du quiz..." : "Pas assez de mots connus pour un quiz. Traduis-en d’autres d’abord."}
                    </p>
                  ) : (
                    <div className="grid w-full gap-2 sm:grid-cols-2">
                      {quizChoices.map((choice) => {
                        const isCorrectChoice = choice === activeCard.meaning;
                        const isSelected = selectedQuizChoice === choice;
                        const feedbackClass = selectedQuizChoice
                          ? isCorrectChoice
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                            : isSelected
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                          : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]";

                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => handleQuizAnswer(activeCard, choice)}
                            disabled={selectedQuizChoice !== null}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${feedbackClass}`}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : !showAnswer ? (
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
                          onClick={() => void submitReviewCard(activeCard.id, quality)}
                          disabled={isReviewing && reviewCardId === activeCard.id}
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
                      onClick={() => setCardPendingDeletion(card)}
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

      <ConfirmDialog
        open={cardPendingDeletion !== null}
        title="Supprimer cette carte ?"
        description={
          cardPendingDeletion
            ? `« ${cardPendingDeletion.lemma} » sera définitivement supprimée de ce deck, avec son historique de révision.`
            : undefined
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          if (cardPendingDeletion) {
            void handleDeleteCard(cardPendingDeletion.id);
          }
          setCardPendingDeletion(null);
        }}
        onCancel={() => setCardPendingDeletion(null)}
      />

      <ConfirmDialog
        open={isDeckDeletionPending}
        title="Supprimer ce deck ?"
        description={`« ${deck?.name ?? "Ce deck"} » et ses ${deck?.cards.length ?? 0} carte(s) seront supprimés définitivement.`}
        confirmLabel={isDeletingDeck ? "Suppression..." : "Supprimer"}
        danger
        onConfirm={() => {
          setIsDeckDeletionPending(false);
          void handleDeleteDeck();
        }}
        onCancel={() => setIsDeckDeletionPending(false)}
      />
    </main>
  );
}
