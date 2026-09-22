"use client";

import { FormEvent, useEffect, useState } from "react";

import type { TokenResult } from "@/lib/tokenizer/types";
import type { JLPTLevel } from "@/lib/difficulty/classify";

const starterText = "私は毎朝コーヒーを飲みながら、日本語を勉強しています。";

type SourceTextSummary = {
  id: string;
  content: string;
  title: string | null;
  createdAt: string;
};

type DeckCard = {
  id: string;
  lemma: string;
  reading?: string | null;
  meaning?: string | null;
  dueAt?: string | null;
  imageUrl?: string | null;
  imageAttribution?: string | null;
  audioCacheId?: string | null;
};

type DeckSummary = {
  id: string;
  name: string;
  description?: string | null;
  cards: DeckCard[];
};

export default function Home() {
  const [text, setText] = useState(starterText);
  const [tokens, setTokens] = useState<TokenResult[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [recentSourceTexts, setRecentSourceTexts] = useState<SourceTextSummary[]>([]);
  const [selectedSourceTextId, setSelectedSourceTextId] = useState<string | null>(null);
  const [vocabularyEntries, setVocabularyEntries] = useState<Array<{ lemma: string; occurrenceCount: number; reading?: string | null; partOfSpeech?: string | null; difficulty?: JLPTLevel }>>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "N5" | "N4" | "N3" | "N2" | "N1">("all");
  const [translation, setTranslation] = useState<{ translation: string; explanation: string; difficulty: JLPTLevel } | null>(null);
  const [textTranslation, setTextTranslation] = useState<{ translation: string; explanation: string; difficulty: JLPTLevel } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckName, setDeckName] = useState("Mon deck japonais");
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [reviewCardId, setReviewCardId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [deckCards, setDeckCards] = useState<Array<{
    id: string;
    lemma: string;
    reading?: string | null;
    meaning?: string | null;
    occurrences: Array<{ id: string; sourceText: { id: string; title: string | null; content: string } | null }>;
  }>>([]);
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [deckStats, setDeckStats] = useState<{
    totalCards: number;
    dueCards: number;
    totalReviews: number;
    successRate: number | null;
    recentReviews: Array<{ id: string; lemma: string; quality: number; reviewedAt: string }>;
  } | null>(null);

  const visibleTokens = showParticles
    ? tokens
    : tokens.filter((token) => token.partOfSpeech !== "助詞");

  const addedLemmas = new Set(decks.flatMap((deck) => deck.cards.map((card) => card.lemma)));

  const normalizedCardSearch = cardSearchQuery.trim().toLowerCase();
  const filteredDeckCards = normalizedCardSearch
    ? deckCards.filter((card) =>
        [card.lemma, card.reading, card.meaning]
          .filter((value): value is string => typeof value === "string")
          .some((value) => value.toLowerCase().includes(normalizedCardSearch)),
      )
    : deckCards;

  const filteredVocabularyEntries = selectedDifficulty === "all"
    ? vocabularyEntries
    : vocabularyEntries.filter((entry) => (entry.difficulty ?? "N5") === selectedDifficulty);

  const selectedDeckReview = selectedDeckId
    ? (() => {
        const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);

        if (!selectedDeck) {
          return null;
        }

        const sortedCards = [...selectedDeck.cards].sort((a, b) => {
          const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
          const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
          return timeA - timeB;
        });

        const dueCards = sortedCards.filter((card) => {
          if (!card.dueAt) {
            return true;
          }

          return new Date(card.dueAt).getTime() <= Date.now();
        });

        const activeCard = dueCards[0];

        return (
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--background)] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Daily review</p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">Révision du deck</h3>
              </div>
              <span className="count-badge">{dueCards.length}</span>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
                Total: {selectedDeck.cards.length}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
                Due today: {dueCards.length}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5">
                Nouveau: {Math.max(0, selectedDeck.cards.length - dueCards.length)}
              </span>
            </div>

            {activeCard ? (
              <>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
                  <p className="text-sm text-[var(--muted)]">Mot à revoir</p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--ink)]" lang="ja">
                    {activeCard.lemma}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {activeCard.reading ?? "lecture inconnue"}
                  </p>

                  {showAnswer ? (
                    <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--background)] p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent)]">Réponse</p>
                      <p className="mt-2 text-lg font-medium text-[var(--ink)]">
                        {activeCard.meaning ?? "Sens à compléter"}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {!showAnswer ? (
                    <button
                      type="button"
                      onClick={() => setShowAnswer(true)}
                      className="primary-button"
                    >
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
                            onClick={() => {
                              setReviewCardId(activeCard.id);
                              void submitReviewCard(quality);
                            }}
                            disabled={isReviewing}
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
                  Tu peux ajouter de nouveaux mots ou revenir plus tard.
                </p>
              </div>
            )}
          </div>
        );
      })()
    : null;

  // Charge les tokens déjà enregistrés pour un texte existant dans la DB.
  async function loadTokensForText(sourceTextId: string) {
    try {
      const response = await fetch(`/api/tokens?sourceTextId=${encodeURIComponent(sourceTextId)}`);
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de récupérer les tokens enregistrés");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      if (!("tokens" in data) || !Array.isArray(data.tokens)) {
        throw new Error("Réponse inattendue lors du chargement des tokens");
      }

      setSelectedSourceTextId(sourceTextId);
      setTokens(data.tokens as TokenResult[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Une erreur est survenue lors du chargement des tokens.",
      );
    }
  }

  useEffect(() => {
    async function loadRecentSourceTexts() {
      try {
        const response = await fetch("/api/source-texts");
        const data: unknown = await response.json();

        if (
          response.ok &&
          typeof data === "object" &&
          data !== null &&
          "sourceTexts" in data &&
          Array.isArray(data.sourceTexts)
        ) {
          setRecentSourceTexts(data.sourceTexts as SourceTextSummary[]);
        }
      } catch {
        // The analysis remains usable if loading the history fails.
      }
    }

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
          setVocabularyEntries(data.entries as Array<{ lemma: string; occurrenceCount: number; reading?: string | null; partOfSpeech?: string | null }>);
        }
      } catch {
        // The vocabulary remains optional in the first iteration.
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
          const loadedDecks = data.decks as DeckSummary[];
          setDecks(loadedDecks);

          if (loadedDecks.length > 0 && !selectedDeckId) {
            setSelectedDeckId(loadedDecks[0].id);
          }
        }
      } catch {
        // Decks are optional until the first user action.
      }
    }

    void loadRecentSourceTexts();
    void loadVocabulary();
    void loadDecks();
  }, [selectedDeckId]);

  useEffect(() => {
    async function loadDeckDetails() {
      if (!selectedDeckId) {
        setDeckCards([]);
        setDeckStats(null);
        return;
      }

      await Promise.all([loadDeckCards(selectedDeckId), loadDeckStats(selectedDeckId)]);
    }

    void loadDeckDetails();
  }, [selectedDeckId]);

  async function loadDeckCards(deckId: string) {
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
        setDeckCards(
          data.cards as Array<{
            id: string;
            lemma: string;
            reading?: string | null;
            meaning?: string | null;
            occurrences: Array<{ id: string; sourceText: { id: string; title: string | null; content: string } | null }>;
          }>,
        );
      }
    } catch {
      // The card list can be refreshed again later.
    }
  }

  async function loadDeckStats(deckId: string) {
    try {
      const response = await fetch(`/api/decks/${deckId}/stats`);
      const data: unknown = await response.json();

      if (response.ok && typeof data === "object" && data !== null && !("error" in data)) {
        setDeckStats(
          data as {
            totalCards: number;
            dueCards: number;
            totalReviews: number;
            successRate: number | null;
            recentReviews: Array<{ id: string; lemma: string; quality: number; reviewedAt: string }>;
          },
        );
      }
    } catch {
      // Stats are optional and can be refreshed again later.
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!selectedDeckId) {
      return;
    }

    try {
      const response = await fetch(`/api/decks/${selectedDeckId}/cards/${cardId}`, {
        method: "DELETE",
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de supprimer la carte");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      await Promise.all([
        fetchDecks(),
        loadDeckCards(selectedDeckId),
        loadDeckStats(selectedDeckId),
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la suppression de la carte.",
      );
    }
  }

  function selectDeck(deckId: string) {
    setSelectedDeckId(deckId);
    setShowAnswer(false);
  }

  async function handleTranslateToken(token: TokenResult) {
    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: token.baseForm || token.surface,
          sourceLanguage: "ja",
          targetLanguage: "fr",
        }),
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de traduire le mot");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      if (!("result" in data) || typeof data.result !== "object" || data.result === null) {
        throw new Error("Réponse inattendue de la traduction");
      }

      const result = data.result as { translation: string; explanation: string; difficulty: JLPTLevel };
      setTranslation(result);
    } catch (requestError) {
      setTranslation(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la traduction.",
      );
    } finally {
      setIsTranslating(false);
    }
  }

  async function handleTranslateText() {
    if (text.trim().length === 0) {
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceLanguage: "ja",
          targetLanguage: "fr",
        }),
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de traduire la phrase");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      if (!("result" in data) || typeof data.result !== "object" || data.result === null) {
        throw new Error("Réponse inattendue de la traduction");
      }

      setTextTranslation(data.result as { translation: string; explanation: string; difficulty: JLPTLevel });
    } catch (requestError) {
      setTextTranslation(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la traduction de la phrase.",
      );
    } finally {
      setIsTranslating(false);
    }
  }

  async function handleCreateDeck() {
    const trimmedName = deckName.trim();

    if (!trimmedName) {
      setError("Le nom du deck est requis.");
      return;
    }

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
      setSelectedDeckId(nextDeck.id);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la création du deck.",
      );
    }
  }

  async function submitReviewCard(quality: number) {
    if (!selectedDeckId || !reviewCardId) {
      return;
    }

    setIsReviewing(true);
    setError(null);

    try {
      const response = await fetch(`/api/decks/${selectedDeckId}/cards/${reviewCardId}/review`, {
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

      await Promise.all([
        fetchDecks(),
        loadDeckStats(selectedDeckId),
      ]);
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

  async function handleAddCardToDeck() {
    if (!selectedToken) {
      setError("Sélectionne d’abord un mot.");
      return;
    }

    try {
      let currentDeckId = selectedDeckId;

      if (!currentDeckId) {
        const response = await fetch("/api/decks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: deckName.trim() || "Mon deck japonais" }),
        });
        const data: unknown = await response.json();

        if (!response.ok || typeof data !== "object" || data === null) {
          throw new Error("Impossible de créer le deck avant d’ajouter la carte");
        }

        if ("error" in data && typeof data.error === "string") {
          throw new Error(data.error);
        }

        if (!("deck" in data) || typeof data.deck !== "object" || data.deck === null) {
          throw new Error("Réponse inattendue lors de la création du deck");
        }

        const createdDeck = data.deck as DeckSummary;
        setDecks((current) => [createdDeck, ...current.filter((deck) => deck.id !== createdDeck.id)]);
        currentDeckId = createdDeck.id;
        setSelectedDeckId(createdDeck.id);
      }

      const response = await fetch(`/api/decks/${currentDeckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lemma: selectedToken.baseForm || selectedToken.surface,
          surface: selectedToken.surface,
          reading: selectedToken.reading,
          meaning: translation?.translation ?? null,
          sourceTextId: selectedSourceTextId,
          position: selectedToken.position,
        }),
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible d’ajouter la carte au deck");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      await Promise.all([
        fetchDecks(),
        loadDeckCards(currentDeckId),
        loadDeckStats(currentDeckId),
      ]);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant l’ajout au deck.",
      );
    } finally {
      setIsSavingCard(false);
    }
  }

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

  // Tokenise un texte déjà sauvegardé, lie les tokens au SourceText et
  // rafraîchit le vocabulaire. Partagé entre la saisie manuelle et la
  // citation d'anime générée, qui créent toutes deux un SourceText avant
  // d'appeler cette fonction.
  async function analyzeSourceText(sourceTextId: string, content: string) {
    const tokenizeResponse = await fetch("/api/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content }),
    });
    const tokenizeData: unknown = await tokenizeResponse.json();

    if (
      !tokenizeResponse.ok ||
      typeof tokenizeData !== "object" ||
      tokenizeData === null
    ) {
      throw new Error("Analyse impossible");
    }

    if ("error" in tokenizeData && typeof tokenizeData.error === "string") {
      throw new Error(tokenizeData.error);
    }

    if (!("tokens" in tokenizeData) || !Array.isArray(tokenizeData.tokens)) {
      throw new Error("Réponse inattendue du serveur");
    }

    const analyzedTokens = tokenizeData.tokens as TokenResult[];
    setTokens(analyzedTokens);

    const tokenSaveResponse = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceTextId,
        tokens: analyzedTokens,
      }),
    });
    const tokenSaveData: unknown = await tokenSaveResponse.json();

    if (!tokenSaveResponse.ok || typeof tokenSaveData !== "object" || tokenSaveData === null) {
      throw new Error("Impossible de sauvegarder les tokens");
    }

    if ("error" in tokenSaveData && typeof tokenSaveData.error === "string") {
      throw new Error(tokenSaveData.error);
    }

    const vocabularyResponse = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokens: analyzedTokens,
        sourceLanguage: "ja",
        targetLanguage: "fr",
      }),
    });
    const vocabularyData: unknown = await vocabularyResponse.json();

    if (!vocabularyResponse.ok || typeof vocabularyData !== "object" || vocabularyData === null) {
      throw new Error("Impossible de sauvegarder le vocabulaire");
    }

    if ("error" in vocabularyData && typeof vocabularyData.error === "string") {
      throw new Error(vocabularyData.error);
    }

    const refreshedVocabularyResponse = await fetch("/api/vocabulary");
    const refreshedVocabularyData: unknown = await refreshedVocabularyResponse.json();

    if (
      refreshedVocabularyResponse.ok &&
      typeof refreshedVocabularyData === "object" &&
      refreshedVocabularyData !== null &&
      "entries" in refreshedVocabularyData &&
      Array.isArray(refreshedVocabularyData.entries)
    ) {
      setVocabularyEntries(refreshedVocabularyData.entries as Array<{ lemma: string; occurrenceCount: number; reading?: string | null; partOfSpeech?: string | null }>);
    }

    await loadTokensForText(sourceTextId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSelectedToken(null);
    setTranslation(null);
    setTextTranslation(null);

    try {
      // 1) Sauvegarde d'abord le texte source pour obtenir son id.
      const sourceResponse = await fetch("/api/source-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          origin: "manual",
          category: "practice",
        }),
      });
      const sourceData: unknown = await sourceResponse.json();

      if (!sourceResponse.ok || typeof sourceData !== "object" || sourceData === null) {
        throw new Error("Impossible de sauvegarder le texte");
      }

      if ("error" in sourceData && typeof sourceData.error === "string") {
        throw new Error(sourceData.error);
      }

      if (!("sourceText" in sourceData) || typeof sourceData.sourceText !== "object" || sourceData.sourceText === null) {
        throw new Error("Réponse inattendue lors de la sauvegarde");
      }

      const createdSourceText = sourceData.sourceText as SourceTextSummary;

      setRecentSourceTexts((current) => [
        createdSourceText,
        ...current.filter((sourceText) => sourceText.id !== createdSourceText.id),
      ].slice(0, 20));
      setSelectedSourceTextId(createdSourceText.id);

      await analyzeSourceText(createdSourceText.id, text);
    } catch (requestError) {
      setTokens([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateAnimeQuote() {
    setIsLoadingQuote(true);
    setError(null);
    setSelectedToken(null);
    setTranslation(null);
    setTextTranslation(null);

    try {
      const response = await fetch("/api/source-texts/anime-quote", {
        method: "POST",
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de générer une citation");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      if (!("sourceText" in data) || typeof data.sourceText !== "object" || data.sourceText === null) {
        throw new Error("Réponse inattendue lors de la génération");
      }

      const generatedSourceText = data.sourceText as SourceTextSummary;

      setText(generatedSourceText.content);
      setRecentSourceTexts((current) => [
        generatedSourceText,
        ...current.filter((sourceText) => sourceText.id !== generatedSourceText.id),
      ].slice(0, 20));
      setSelectedSourceTextId(generatedSourceText.id);

      await analyzeSourceText(generatedSourceText.id, generatedSourceText.content);
    } catch (requestError) {
      setTokens([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la génération de la citation.",
      );
    } finally {
      setIsLoadingQuote(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">MoriWords / 01</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-6xl">
              De la phrase brute au mot compris.
            </h1>
          </div>
          <div className="hidden border-l border-[var(--line)] pl-5 text-right text-sm text-[var(--muted)] sm:block">
            <span className="block text-[var(--ink)]">日本語 → Français</span>
            <span>Analyse morphologique</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <form onSubmit={handleSubmit} className="panel flex flex-col p-6 sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Source text</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Colle ton japonais
                </h2>
              </div>
              <span className="status-dot" aria-label="Tokenizer disponible" />
            </div>

            <label htmlFor="japanese-text" className="sr-only">
              Texte japonais à analyser
            </label>
            <textarea
              id="japanese-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="日本語の文章をここに貼り付けてください。"
              className="min-h-72 flex-1 resize-none rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 text-xl leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              lang="ja"
            />

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-[var(--muted)]">
                {text.length} caractères
              </span>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleGenerateAnimeQuote()}
                  disabled={isLoadingQuote || isLoading}
                  className="secondary-button"
                >
                  {isLoadingQuote ? "Génération..." : "Citation d'anime"}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || text.trim().length === 0}
                  className="primary-button"
                >
                  {isLoading ? "Analyse en cours..." : "Analyser le texte"}
                </button>
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </form>

          <section className="panel min-h-[520px] p-6 sm:p-8" aria-live="polite">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Token map</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Mots détectés
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={showParticles}
                    onChange={(event) => setShowParticles(event.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                  Particules
                </label>
                <span className="count-badge">{visibleTokens.length}</span>
              </div>
            </div>

            {tokens.length > 0 ? (
              <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4">
                <p className="eyebrow">Source preview</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--ink)]" lang="ja">
                  {text}
                </p>
                <button
                  type="button"
                  onClick={() => void handleTranslateText()}
                  disabled={isTranslating}
                  className="secondary-button mt-4"
                >
                  {isTranslating ? "Traduction..." : "Traduire la phrase"}
                </button>
                {textTranslation ? (
                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="text-sm text-[var(--muted)]">Traduction de la phrase</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                      {textTranslation.translation}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {textTranslation.explanation}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tokens.length === 0 ? (
              <div className="empty-state">
                <span className="mb-4 text-4xl" aria-hidden="true">あ</span>
                <p className="font-medium text-[var(--ink)]">
                  Les tokens apparaîtront ici.
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--muted)]">
                  Chaque mot sera accompagné de sa forme dictionnaire, sa lecture
                  et sa catégorie grammaticale.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleTokens.map((token) => {
                  const isSelected = selectedToken?.position === token.position;

                  return (
                    <button
                      key={`${token.position}-${token.surface}`}
                      type="button"
                      onClick={() => setSelectedToken(token)}
                      className={`token-card text-left ${isSelected ? "token-card-selected" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xl font-semibold text-[var(--ink)]" lang="ja">
                          {token.surface}
                        </span>
                        <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink)]">
                          JLPT {token.difficulty}
                        </span>
                      </div>
                      <span className="mt-1 block text-sm text-[var(--accent)]" lang="ja">
                        {token.reading ?? "lecture inconnue"}
                      </span>
                      <span className="mt-4 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                        <span>{token.baseForm}</span>
                        <span className="part-of-speech">{token.partOfSpeech}</span>
                      </span>
                      {addedLemmas.has(token.baseForm || token.surface) ? (
                        <span className="mt-2 inline-block rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink)]">
                          Déjà ajouté
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedToken ? (
              <div className="mt-6 border-t border-[var(--line)] pt-5">
                <p className="eyebrow">Selected token</p>
                <p className="mt-2 text-lg text-[var(--ink)]" lang="ja">
                  {selectedToken.surface} <span className="text-[var(--muted)]">·</span>{" "}
                  {selectedToken.baseForm}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-[var(--muted)]">JLPT</span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1 text-xs font-medium text-[var(--ink)]">
                    {selectedToken.difficulty}
                  </span>
                  {addedLemmas.has(selectedToken.baseForm || selectedToken.surface) ? (
                    <span className="rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--ink)]">
                      Déjà ajouté
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleTranslateToken(selectedToken)}
                    disabled={isTranslating}
                    className="primary-button"
                  >
                    {isTranslating ? "Traduction..." : "Traduire"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSavingCard(true);
                      void handleAddCardToDeck();
                    }}
                    disabled={isSavingCard}
                    className="primary-button"
                  >
                    {isSavingCard
                      ? "Ajout..."
                      : addedLemmas.has(selectedToken.baseForm || selectedToken.surface)
                        ? "Ajouter une occurrence"
                        : "Ajouter au deck"}
                  </button>
                </div>

                {translation ? (
                  <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--background)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-[var(--muted)]">Traduction</p>
                      <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1 text-xs font-medium text-[var(--ink)]">
                        {translation.difficulty}
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-[var(--ink)]">
                      {translation.translation}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {translation.explanation}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </section>

        <section className="mt-8 panel p-6 sm:p-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Decks</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                Cartes de vocabulaire
              </h2>
            </div>
            <span className="text-sm text-[var(--muted)]">{decks.length} deck(s)</span>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
              placeholder="Nom du deck"
              aria-label="Nom du deck"
              className="min-h-12 flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
            />
            <button type="button" onClick={() => void handleCreateDeck()} className="primary-button">
              Créer le deck
            </button>
          </div>

          {decks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => selectDeck(deck.id)}
                  className={`token-card text-left ${selectedDeckId === deck.id ? "token-card-selected" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-[var(--ink)]">{deck.name}</span>
                    <span className="count-badge">{deck.cards.length}</span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {deck.description ?? "Deck de vocabulaire pour la pratique quotidienne."}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="font-medium text-[var(--ink)]">Aucun deck pour le moment.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Crée un deck puis ajoute-y quelques mots sélectionnés.
              </p>
            </div>
          )}

          {selectedDeckReview}
        </section>

        {selectedDeckId && deckStats ? (
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

        {selectedDeckId ? (
          <section className="mt-8 panel p-6 sm:p-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Manage</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Cartes du deck
                </h2>
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
        ) : null}

        {vocabularyEntries.length > 0 ? (
          <section className="mt-8 panel p-6 sm:p-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Saved vocabulary</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Vocabulaire global
                </h2>
              </div>
              <span className="text-sm text-[var(--muted)]">{filteredVocabularyEntries.length} mots</span>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {(["all", "N5", "N4", "N3", "N2", "N1"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedDifficulty(level)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selectedDifficulty === level
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                  }`}
                >
                  {level === "all" ? "Tous" : level}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                    <span>{entry.difficulty ?? "N5"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                    <span>{entry.partOfSpeech || "—"}</span>
                    {addedLemmas.has(entry.lemma) ? (
                      <span className="rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-2 py-0.5 font-medium text-[var(--ink)]">
                        Déjà ajouté
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {recentSourceTexts.length > 0 ? (
          <section className="mt-8 panel p-6 sm:p-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Saved texts</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  Tes derniers textes
                </h2>
              </div>
              <span className="text-sm text-[var(--muted)]">
                {recentSourceTexts.length} affiché(s)
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {recentSourceTexts.map((sourceText) => (
                <button
                  key={sourceText.id}
                  type="button"
                  onClick={() => void loadTokensForText(sourceText.id)}
                  className={`token-card text-left ${selectedSourceTextId === sourceText.id ? "token-card-selected" : ""}`}
                >
                  <time className="eyebrow" dateTime={sourceText.createdAt}>
                    {new Date(sourceText.createdAt).toLocaleDateString("fr-FR")}
                  </time>
                  {sourceText.title ? (
                    <p className="mt-1 text-xs font-medium text-[var(--accent)]">{sourceText.title}</p>
                  ) : null}
                  <p className="mt-2 line-clamp-2 text-base leading-7 text-[var(--ink)]" lang="ja">
                    {sourceText.content}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
