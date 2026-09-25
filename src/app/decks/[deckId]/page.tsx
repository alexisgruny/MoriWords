"use client";

import { useParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { buildQuizChoices } from "@/lib/decks/card-utils";
import type { DeckCard, DeckCardWithOccurrences, DeckSummary } from "@/types/shared";

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

// Page d'accueil d'un deck : l'entraînement (révision des cartes dues avec 4
// modes). La liste des mots et les statistiques ont leurs propres pages,
// accessibles depuis les boutons de l'en-tête (voir layout.tsx).
export default function DeckTrainingPage() {
  const params = useParams<{ deckId: string }>();
  const deckId = params.deckId;
  const { showToast } = useToast();

  const [deck, setDeck] = useState<DeckSummary | null>(null);
  const [deckCards, setDeckCards] = useState<DeckCardWithOccurrences[]>([]);
  const [reviewCardId, setReviewCardId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("standard");
  const [error, setError] = useState<string | null>(null);
  const [quizChoices, setQuizChoices] = useState<string[]>([]);
  const [selectedQuizChoice, setSelectedQuizChoice] = useState<string | null>(null);
  const [isLoadingQuizChoices, setIsLoadingQuizChoices] = useState(false);

  // Charge le deck et ses cartes à chaque changement de deck.
  useEffect(() => {
    void loadDeck();
    void loadDeckCards();
    // loadDeck/loadDeckCards close over deckId and loadDeck is also called
    // after each review below; only re-run on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Va chercher les informations du deck (nom, cartes) sur le serveur.
  async function loadDeck() {
    try {
      const response = await fetch(`/api/decks/${deckId}`);
      const data: unknown = await response.json();

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
      // The deck can be refreshed again later.
    }
  }

  // Va chercher les cartes du deck avec leurs occurrences (textes source), pour
  // le mode d'entraînement "Contexte" et les leurres du quiz.
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

      await loadDeck();
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

  return (
    <>
      {error ? (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="panel p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Daily review</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">Entraînement</h2>
          </div>
          <span className="count-badge" aria-label={`${dueCards.length} carte(s) à revoir`}>
            {dueCards.length}
          </span>
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
                    Ce mot n’a pas encore de sens enregistré — ajoute-le depuis l’onglet Mots ou
                    utilise un autre mode pour le réviser.
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
    </>
  );
}
