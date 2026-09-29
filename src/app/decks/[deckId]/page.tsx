"use client";

import { useParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { GradeButtons, ReviewDone, SessionProgress, qualityForKey } from "@/components/review-controls";
import { SpeakButton } from "@/components/speak-button";
import { useToast } from "@/components/toast-provider";
import { buildQuizChoices } from "@/lib/decks/card-utils";
import type { DeckCard, DeckCardWithOccurrences, DeckSummary } from "@/types/shared";

// Les façons de présenter une carte pendant la révision : le mode standard
// montre le kanji et sa lecture, le mode kanji ne montre que le kanji, le
// mode contexte montre une phrase où le mot est apparu, et le mode quiz
// propose 4 choix de sens au lieu d'une auto-évaluation.
type ReviewMode = "standard" | "kanji" | "context" | "quiz";

// Les modes du sélecteur : un libellé qui dit ce qu'on voit (« Standard »
// ou « Kanji » ne l'expliquaient pas) et une phrase sur ce qu'on doit trouver.
const reviewModes: Array<{ id: ReviewMode; label: string; description: string }> = [
  { id: "standard", label: "Mot + lecture", description: "Tu vois le mot et sa lecture : retrouve son sens." },
  { id: "kanji", label: "Kanji seul", description: "Tu vois le mot sans sa lecture : retrouve comment il se lit et ce qu'il veut dire." },
  { id: "context", label: "Dans la phrase", description: "Tu vois le mot dans une phrase où tu l'as rencontré : comprends-le en contexte." },
  { id: "quiz", label: "QCM", description: "Choisis le bon sens parmi 4 propositions." },
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
  // Carte dont la dernière réponse peut encore être annulée (une seule, la
  // plus récente : annuler une deuxième fois annulerait celle d'avant).
  const [undoableCardId, setUndoableCardId] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  // Cartes notées depuis l'arrivée sur ce deck (barre de progression et
  // écran de fin de session). Remis à zéro en changeant de deck, pendant le
  // rendu plutôt que dans un effet (motif recommandé par React pour un état
  // dérivé d'une valeur qui change).
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [sessionDeckId, setSessionDeckId] = useState(deckId);
  if (sessionDeckId !== deckId) {
    setSessionDeckId(deckId);
    setSessionReviewed(0);
  }

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
      setUndoableCardId(cardId);
      setSessionReviewed((count) => count + 1);
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

  // Annule la dernière réponse envoyée (voir POST .../undo-review) : la carte
  // retrouve son état SM-2 précédent et redevient la carte active si elle est
  // à nouveau due.
  async function handleUndoReview(cardId: string) {
    setIsUndoing(true);

    try {
      const response = await fetch(`/api/decks/${deckId}/cards/${cardId}/undo-review`, { method: "POST" });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible d'annuler la révision");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      await loadDeck();
      setUndoableCardId(null);
      setSessionReviewed((count) => Math.max(0, count - 1));
      showToast("Révision annulée.");
    } catch (requestError) {
      showToast(
        requestError instanceof Error ? requestError.message : "L'annulation a échoué.",
        "error",
      );
    } finally {
      setIsUndoing(false);
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

  // N'affiche le bouton d'annulation que si la carte concernée appartient
  // encore au deck affiché (évite un bouton qui pointerait vers un autre deck
  // après une navigation directe entre deux decks sans révision entre-temps).
  const canUndoLastReview = Boolean(undoableCardId && deck?.cards.some((card) => card.id === undoableCardId));

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

  // Raccourcis clavier, pour éviter d'avoir à prendre la souris à chaque
  // carte pendant une session de révision (l'action la plus répétée du
  // site) : espace/entrée révèle la réponse, 0-5 note la carte selon
  // l'échelle SM-2, 1-4 choisit une réponse en mode quiz.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!activeCard || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      if (reviewMode === "quiz") {
        if (selectedQuizChoice || quizChoices.length === 0) {
          return;
        }

        const index = Number(event.key) - 1;

        if (Number.isInteger(index) && index >= 0 && index < quizChoices.length) {
          event.preventDefault();
          handleQuizAnswer(activeCard, quizChoices[index]);
        }

        return;
      }

      if (!showAnswer) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setShowAnswer(true);
        }

        return;
      }

      if (isReviewing && reviewCardId === activeCard.id) {
        return;
      }

      const quality = qualityForKey(event.key);

      if (quality !== null) {
        event.preventDefault();
        void submitReviewCard(activeCard.id, quality);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // handleQuizAnswer/submitReviewCard are recreated every render but only
    // close over state already listed below; omitted to avoid re-binding the
    // listener on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCard, reviewMode, showAnswer, quizChoices, selectedQuizChoice, isReviewing, reviewCardId]);

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

    // Laisse le temps de lire le verdict (texte "Bonne réponse"/"la bonne
    // réponse était...", pas seulement la couleur) avant que la carte
    // suivante ne remplace le quiz.
    setTimeout(() => {
      void submitReviewCard(card.id, quality);
    }, 1700);
  }

  return (
    <>
      {error ? (
        <p className="error-banner mb-6">
          {error}
        </p>
      ) : null}

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">
            <strong className="text-[var(--ink)]">{dueCards.length}</strong> à revoir aujourd&apos;hui
          </p>
          <div className="flex items-center gap-3">
            {canUndoLastReview && undoableCardId ? (
              <button
                type="button"
                onClick={() => void handleUndoReview(undoableCardId)}
                disabled={isUndoing}
                className="link-button"
              >
                {isUndoing ? "Annulation..." : "Annuler la dernière réponse"}
              </button>
            ) : null}
          </div>
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
              className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
                reviewMode === mode.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                  : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="-mt-2 mb-4 text-sm text-[var(--muted)]">
          {reviewModes.find((mode) => mode.id === reviewMode)?.description}
        </p>

        <SessionProgress reviewed={sessionReviewed} remaining={dueCards.length} />

        {activeCard ? (
          <>
            {/* key = carte : chaque nouvelle carte est un nouvel élément, donc
                l'animation d'entrée rejoue à chaque passage à la suivante. */}
            <div
              key={activeCard.id}
              className="fade-in-up rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-center sm:p-8"
            >
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
                    <p className="mt-2 text-5xl font-bold text-[var(--ink)]" lang="ja">
                      {activeCard.lemma}
                    </p>
                  </>
                )
              ) : (
                <>
                  <p className="text-sm text-[var(--muted)]">Mot à revoir</p>
                  <p className="mt-2 text-5xl font-bold text-[var(--ink)]" lang="ja">
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
                <div className="fade-in-up mt-5 border-t border-dashed border-[var(--line-strong)] pt-5">
                  <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--accent-dark)]">
                    Réponse
                    <SpeakButton text={activeCard.reading ?? activeCard.lemma} label="Écouter le mot" size="sm" />
                  </p>
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

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {reviewMode === "quiz" ? (
                !activeCard.meaning ? (
                  <p className="text-sm text-[var(--muted)]">
                    Ce mot n&apos;a pas encore de sens enregistré — ajoute-le depuis l&apos;onglet Mots ou
                    utilise un autre mode pour le réviser.
                  </p>
                ) : quizChoices.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    {isLoadingQuizChoices ? "Préparation du quiz..." : "Pas assez de mots connus pour un quiz. Traduis-en d'autres d'abord."}
                  </p>
                ) : (
                  <>
                    {selectedQuizChoice ? (
                      <div
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${
                          selectedQuizChoice === activeCard.meaning
                            ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success-dark)]"
                            : "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                        }`}
                        role="status"
                        aria-live="polite"
                      >
                        {selectedQuizChoice === activeCard.meaning
                          ? "✓ Bonne réponse !"
                          : `✗ Pas tout à fait — la bonne réponse était : ${activeCard.meaning}`}
                      </div>
                    ) : null}

                    <div className="grid w-full gap-2 sm:grid-cols-2">
                      {quizChoices.map((choice, index) => {
                        const isCorrectChoice = choice === activeCard.meaning;
                        const isSelected = selectedQuizChoice === choice;
                        const feedbackClass = selectedQuizChoice
                          ? isCorrectChoice
                            ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success-dark)]"
                            : isSelected
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                              : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
                          : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]";

                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => handleQuizAnswer(activeCard, choice)}
                            disabled={selectedQuizChoice !== null}
                            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${feedbackClass}`}
                          >
                            <span className="mono text-xs text-[var(--muted)]">
                              {selectedQuizChoice
                                ? isCorrectChoice
                                  ? "✓"
                                  : isSelected
                                    ? "✗"
                                    : index + 1
                                : index + 1}
                            </span>
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                    <p className="keyboard-hint w-full text-xs text-[var(--muted)]">
                      Raccourci clavier : <span className="kbd">1</span> à <span className="kbd">4</span>.
                    </p>
                  </>
                )
              ) : !showAnswer ? (
                <button type="button" onClick={() => setShowAnswer(true)} className="primary-button w-full sm:w-auto">
                  Afficher la réponse <span className="kbd ml-1.5 border-white/40! bg-transparent! text-white">espace</span>
                </button>
              ) : (
                <GradeButtons
                  onGrade={(quality) => void submitReviewCard(activeCard.id, quality)}
                  disabled={isReviewing && reviewCardId === activeCard.id}
                />
              )}
            </div>
          </>
        ) : (
          <ReviewDone
            reviewed={sessionReviewed}
            emptyHint="Ajoute de nouveaux mots depuis la page Analyser, ou reviens plus tard."
          />
        )}
      </section>
    </>
  );
}
