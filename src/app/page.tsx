"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { TodayPanel } from "@/components/today-panel";
import { useToast } from "@/components/toast-provider";
import { jlptBadgeClass } from "@/lib/jlpt-badge";
import { MAX_ANALYSIS_TEXT_LENGTH } from "@/lib/security/input-limits";
import { translatePartOfSpeech } from "@/lib/tokenizer/part-of-speech-labels";
import { isNoiseToken } from "@/lib/tokenizer/token-filters";
import type { TokenResult } from "@/lib/tokenizer/types";
import type { DeckSummary, SourceTextSummary, TranslationResult } from "@/types/shared";

// Texte affiché par défaut dans la zone de saisie, au premier chargement.
// Exemple prérempli dans le ton d'une réplique d'anime (niveau N5-N4), pour
// qu'un nouveau compte puisse cliquer sur "Analyser" sans rien chercher.
const starterText = "明日も一緒に頑張ろう！絶対にあきらめないで。";

// Sources de contenu généré disponibles en un clic, chacune backée par
// POST /api/source-texts/<key> (voir src/lib/feeds/).
// Les deux premières sont mises en avant (les plus faciles pour débuter),
// les autres restent derrière « Plus d'idées ».
const GENERATED_SOURCES = [
  { key: "anime-quote", label: "Réplique d'anime" },
  { key: "daily-dialogue", label: "Dialogue du quotidien" },
  { key: "news-summary", label: "Actu simplifiée" },
  { key: "news-rss", label: "Actu du jour (nippon.com)" },
  { key: "literary-excerpt", label: "Extrait littéraire" },
] as const;
const FEATURED_SOURCE_COUNT = 2;

// Mots-outils cachés par défaut : particules (は, を) et auxiliaires (ます,
// ない, う), qui déroutent une débutante et ne s'apprennent pas en fiche.
const GRAMMAR_WORD_CATEGORIES = new Set(["助詞", "助動詞"]);

const STEPS = ["Colle une réplique ou un texte", "Touche les mots", "Garde-les en fiches de révision"];

// Page d'accueil : coller un texte japonais, l'analyser mot par mot, le
// traduire et ajouter des mots à un deck. C'est le cœur du parcours d'apprentissage.
export default function Home() {
  const { showToast } = useToast();
  const [text, setText] = useState(starterText);
  const [tokens, setTokens] = useState<TokenResult[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [loadingSourceKey, setLoadingSourceKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showMoreSources, setShowMoreSources] = useState(false);
  // Mot dont la traduction est attendue : une réponse arrivée après un autre
  // clic ne doit pas s'afficher sous le mauvais mot.
  const translatingPositionRef = useRef<number | null>(null);
  const [recentSourceTexts, setRecentSourceTexts] = useState<SourceTextSummary[]>([]);
  const [selectedSourceTextId, setSelectedSourceTextId] = useState<string | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [textTranslation, setTextTranslation] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [selectedTokenPositions, setSelectedTokenPositions] = useState<Set<number>>(new Set());
  const [lastClickedPosition, setLastClickedPosition] = useState<number | null>(null);
  const [tokenTranslations, setTokenTranslations] = useState<Record<number, TranslationResult>>({});
  const [isBulkTranslating, setIsBulkTranslating] = useState(false);
  const [isAddingSelectionToDeck, setIsAddingSelectionToDeck] = useState(false);
  // Avancement affiché pendant un ajout/une traduction en masse (les requêtes
  // partent en parallèle, mais chacune incrémente ce compteur en se terminant,
  // pour ne jamais laisser l'interface paraître figée sur un gros lot).
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  // Dernier deck dans lequel un mot a été ajouté depuis cette page : sert à
  // proposer un accès direct à sa révision sans repasser par la liste des decks.
  const [lastAddedDeckId, setLastAddedDeckId] = useState<string | null>(null);

  // Cache les particules grammaticales par défaut (moins intéressantes à
  // apprendre), sauf si l'utilisateur coche la case pour les voir. Cache
  // aussi toujours le romaji et les chiffres arabes purs (pas du vocabulaire
  // japonais à proprement parler), sans case à cocher pour les réafficher.
  const visibleTokens = (showParticles ? tokens : tokens.filter((token) => !GRAMMAR_WORD_CATEGORIES.has(token.partOfSpeech)))
    .filter((token) => !isNoiseToken(token));

  // La liste des mots déjà présents dans au moins un deck, pour le badge "Déjà ajouté".
  const addedLemmas = new Set(decks.flatMap((deck) => deck.cards.map((card) => card.lemma)));

  // Étape du parcours mise en avant dans le guide sous le titre (1 : pas
  // encore de texte analysé, 2 : des mots à choisir, 3 : un mot choisi).
  const currentStep = selectedToken || selectedTokenPositions.size > 0 ? 3 : tokens.length > 0 ? 2 : 1;

  // Charge l'historique des textes et la liste des decks dès l'affichage de la page.
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

          if (loadedDecks.length > 0) {
            setSelectedDeckId((current) => current ?? loadedDecks[0].id);
          }
        }
      } catch {
        // Decks are optional until the first "add to deck" action.
      }
    }

    void loadRecentSourceTexts();
    void loadDecks();

    // Rouvre un texte choisi depuis la page /historique (lien
    // /?sourceTextId=...), puis nettoie l'URL pour éviter de le rerouvrir
    // si l'utilisateur revient sur cette page plus tard.
    const requestedSourceTextId = new URLSearchParams(window.location.search).get("sourceTextId");
    if (requestedSourceTextId) {
      void loadTokensForText(requestedSourceTextId);
      window.history.replaceState(null, "", "/");
    }
  }, []);

  // Charge les tokens déjà enregistrés pour un texte existant dans la DB.
  async function loadTokensForText(sourceTextId: string) {
    setSelectedToken(null);
    setSelectedTokenPositions(new Set());
    setTokenTranslations({});

    try {
      const [sourceTextResponse, tokensResponse] = await Promise.all([
        fetch(`/api/source-texts/${encodeURIComponent(sourceTextId)}`),
        fetch(`/api/tokens?sourceTextId=${encodeURIComponent(sourceTextId)}`),
      ]);
      const sourceTextData: unknown = await sourceTextResponse.json();
      const tokensData: unknown = await tokensResponse.json();

      if (!tokensResponse.ok || typeof tokensData !== "object" || tokensData === null) {
        throw new Error("Impossible de récupérer les tokens enregistrés");
      }

      if ("error" in tokensData && typeof tokensData.error === "string") {
        throw new Error(tokensData.error);
      }

      if (!("tokens" in tokensData) || !Array.isArray(tokensData.tokens)) {
        throw new Error("Réponse inattendue lors du chargement des tokens");
      }

      if (
        sourceTextResponse.ok &&
        typeof sourceTextData === "object" &&
        sourceTextData !== null &&
        "sourceText" in sourceTextData &&
        typeof sourceTextData.sourceText === "object" &&
        sourceTextData.sourceText !== null &&
        "content" in sourceTextData.sourceText &&
        typeof sourceTextData.sourceText.content === "string"
      ) {
        setText(sourceTextData.sourceText.content);
      }

      setSelectedSourceTextId(sourceTextId);
      setTokens(tokensData.tokens as TokenResult[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Une erreur est survenue lors du chargement des tokens.",
      );
    }
  }

  // Rafraîchit la liste des decks (par exemple après l'ajout d'une carte).
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

  // Crée un nouveau deck depuis le sélecteur "+ Nouveau deck" et le
  // sélectionne aussitôt comme destination pour l'ajout de carte en cours.
  async function handleCreateDeckInline() {
    const trimmedName = newDeckName.trim();

    if (!trimmedName) {
      setError("Le nom du deck est requis.");
      return;
    }

    setIsCreatingDeck(true);
    setError(null);

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

      const createdDeck = data.deck as DeckSummary;
      setDecks((current) => [createdDeck, ...current.filter((deck) => deck.id !== createdDeck.id)]);
      setSelectedDeckId(createdDeck.id);
      setIsCreatingNewDeck(false);
      setNewDeckName("");
      showToast(`Deck « ${createdDeck.name} » créé.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la création du deck.",
      );
    } finally {
      setIsCreatingDeck(false);
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
    // Les mots sont déjà affichés : le reste n'est que de l'enregistrement
    // (historique, vocabulaire), le bouton ne doit plus dire "Analyse en cours".
    setIsSavingAnalysis(true);

    try {
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

      await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokens: analyzedTokens,
          sourceLanguage: "ja",
          targetLanguage: "fr",
        }),
      });

      await loadTokensForText(sourceTextId);
    } finally {
      setIsSavingAnalysis(false);
    }
  }

  // Gère le clic sur "Analyser le texte" : sauvegarde le texte collé puis
  // l'analyse mot par mot.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSelectedToken(null);
    setTranslation(null);
    setTextTranslation(null);
    setSelectedTokenPositions(new Set());
    setTokenTranslations({});

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
      ].slice(0, 6));
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

  // Gère le clic sur un des boutons de source générée (citation d'anime,
  // actualité, dialogue, extrait littéraire...) : demande un texte à
  // Claude via /api/source-texts/<sourceKey>, le met dans la zone de
  // texte, puis l'analyse mot par mot.
  async function handleGenerateSource(sourceKey: string) {
    setLoadingSourceKey(sourceKey);
    setError(null);
    setSelectedToken(null);
    setTranslation(null);
    setTextTranslation(null);
    setSelectedTokenPositions(new Set());
    setTokenTranslations({});

    try {
      const response = await fetch(`/api/source-texts/${sourceKey}`, {
        method: "POST",
      });
      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de générer le contenu");
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
      ].slice(0, 6));
      setSelectedSourceTextId(generatedSourceText.id);

      await analyzeSourceText(generatedSourceText.id, generatedSourceText.content);
    } catch (requestError) {
      setTokens([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la génération du contenu.",
      );
    } finally {
      setLoadingSourceKey(null);
    }
  }

  // Traduit un mot. Sans contexte, la traduction vient du cache partagé par
  // mot (instantané, sans appel à Claude la plupart du temps) : c'est ce qui
  // s'affiche dès qu'on touche un mot. Avec contexte, le sens précis dans la
  // phrase (jamais mis en cache, donc un appel à chaque fois).
  async function handleTranslateToken(token: TokenResult, withContext = true) {
    translatingPositionRef.current = token.position;
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
          ...(withContext ? { context: text } : {}),
        }),
      });
      const data: unknown = await response.json();

      if (translatingPositionRef.current !== token.position) {
        return;
      }

      if (!response.ok || typeof data !== "object" || data === null) {
        throw new Error("Impossible de traduire le mot");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      if (!("result" in data) || typeof data.result !== "object" || data.result === null) {
        throw new Error("Réponse inattendue de la traduction");
      }

      setTranslation(data.result as TranslationResult);
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

  // Traduit la phrase entière collée dans la zone de texte.
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

      setTextTranslation(data.result as TranslationResult);
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

  // S'assure qu'un deck existe pour y ajouter une carte : renvoie le deck
  // actuellement sélectionné, ou crée un deck par défaut sinon. Partagé
  // entre l'ajout d'un seul mot et l'ajout en masse.
  async function ensureDeckId(): Promise<string> {
    if (selectedDeckId) {
      return selectedDeckId;
    }

    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Mon deck japonais" }),
    });
    const data: unknown = await response.json();

    if (!response.ok || typeof data !== "object" || data === null) {
      throw new Error("Impossible de créer le deck avant d'ajouter la carte");
    }

    if ("error" in data && typeof data.error === "string") {
      throw new Error(data.error);
    }

    if (!("deck" in data) || typeof data.deck !== "object" || data.deck === null) {
      throw new Error("Réponse inattendue lors de la création du deck");
    }

    const createdDeck = data.deck as DeckSummary;
    setDecks((current) => [createdDeck, ...current.filter((deck) => deck.id !== createdDeck.id)]);
    setSelectedDeckId(createdDeck.id);
    return createdDeck.id;
  }

  // Ajoute le mot sélectionné comme carte dans le deck choisi. Si aucun
  // deck n'existe encore, en crée un par défaut avant d'ajouter la carte.
  async function handleAddCardToDeck() {
    if (!selectedToken) {
      setError("Sélectionne d'abord un mot.");
      return;
    }

    try {
      const currentDeckId = await ensureDeckId();

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
        throw new Error("Impossible d'ajouter la carte au deck");
      }

      if ("error" in data && typeof data.error === "string") {
        throw new Error(data.error);
      }

      await fetchDecks();
      setError(null);
      setLastAddedDeckId(currentDeckId);
      showToast(`« ${selectedToken.baseForm || selectedToken.surface} » ajouté au deck.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant l'ajout au deck.",
      );
    } finally {
      setIsSavingCard(false);
    }
  }

  // Ajoute en une fois tous les mots actuellement affichés (respecte le
  // filtre particules) au deck sélectionné. Le serveur traduit automatiquement
  // chaque nouveau mot (voir POST /api/decks/[deckId]/cards). Bien plus rapide
  // que d'ajouter chaque mot un par un depuis un texte entier.
  async function handleAddAllTokensToDeck() {
    if (visibleTokens.length === 0) {
      return;
    }

    setIsBulkAdding(true);
    setError(null);
    setBulkProgress({ done: 0, total: visibleTokens.length });

    try {
      const currentDeckId = await ensureDeckId();
      let done = 0;

      const results = await Promise.allSettled(
        visibleTokens.map(async (token) => {
          try {
            const response = await fetch(`/api/decks/${currentDeckId}/cards`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lemma: token.baseForm || token.surface,
                surface: token.surface,
                reading: token.reading,
                sourceTextId: selectedSourceTextId,
                position: token.position,
              }),
            });
            const data: unknown = await response.json();

            if (!response.ok || typeof data !== "object" || data === null) {
              throw new Error("add failed");
            }

            return data as { alreadyExisted: boolean };
          } finally {
            done += 1;
            setBulkProgress({ done, total: visibleTokens.length });
          }
        }),
      );

      const succeeded = results.filter(
        (result): result is PromiseFulfilledResult<{ alreadyExisted: boolean }> =>
          result.status === "fulfilled",
      );
      const newCount = succeeded.filter((result) => !result.value.alreadyExisted).length;
      const alreadyCount = succeeded.length - newCount;
      const failedCount = results.length - succeeded.length;

      await fetchDecks();

      const parts: string[] = [];
      if (newCount > 0) {
        parts.push(`${newCount} nouveau(x)`);
      }
      if (alreadyCount > 0) {
        parts.push(`${alreadyCount} déjà présent(s)`);
      }
      if (parts.length > 0) {
        setLastAddedDeckId(currentDeckId);
        showToast(`${parts.join(", ")} ajouté(s) au deck, avec traduction.`);
      }

      if (failedCount > 0) {
        showToast(`${failedCount} mot(s) n'ont pas pu être ajoutés.`, "error");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant l'ajout en masse.",
      );
    } finally {
      setIsBulkAdding(false);
      setBulkProgress(null);
    }
  }

  // Clic sur une carte de mot : la coche/décoche (sélection multiple, pour les
  // actions groupées). Avec Maj, sélectionne toute la plage depuis le dernier
  // mot cliqué. Le dernier mot coché sert aussi de mot "détail" (panneau du bas).
  function handleTokenClick(token: TokenResult, shiftKey: boolean) {
    const anchor = lastClickedPosition;
    setLastClickedPosition(token.position);

    if (shiftKey && anchor !== null) {
      const anchorIndex = visibleTokens.findIndex((candidate) => candidate.position === anchor);
      const targetIndex = visibleTokens.findIndex((candidate) => candidate.position === token.position);

      if (anchorIndex >= 0 && targetIndex >= 0) {
        const [from, to] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
        const rangePositions = visibleTokens.slice(from, to + 1).map((candidate) => candidate.position);

        setSelectedTokenPositions((current) => new Set([...current, ...rangePositions]));
        setSelectedToken(token);
        return;
      }
    }

    const wasChecked = selectedTokenPositions.has(token.position);
    const nextPositions = new Set(selectedTokenPositions);

    if (wasChecked) {
      nextPositions.delete(token.position);
    } else {
      nextPositions.add(token.position);
    }

    setSelectedTokenPositions(nextPositions);

    // En décochant, le panneau reste sur un des mots encore cochés (sinon la
    // sélection restante n'aurait plus de panneau pour agir dessus).
    const remaining = visibleTokens.filter((candidate) => nextPositions.has(candidate.position));
    setSelectedToken(wasChecked ? (remaining[remaining.length - 1] ?? null) : token);

    // Un seul mot touché : son sens s'affiche tout de suite (« je touche un
    // mot, je comprends »), sans avoir à appuyer sur « Traduire ».
    setTranslation(null);
    if (!wasChecked && nextPositions.size === 1) {
      void handleTranslateToken(token, false);
    }
  }

  // Traduit tous les mots cochés en parallèle et garde le résultat de chacun
  // (affiché sur sa carte), pour les consulter avant de décider quoi ajouter.
  async function handleTranslateSelection() {
    const selectedTokens = visibleTokens.filter((token) => selectedTokenPositions.has(token.position));

    if (selectedTokens.length === 0) {
      return;
    }

    setIsBulkTranslating(true);
    setError(null);
    setBulkProgress({ done: 0, total: selectedTokens.length });

    try {
      let done = 0;

      const results = await Promise.allSettled(
        selectedTokens.map(async (token) => {
          try {
            const response = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: token.baseForm || token.surface,
                sourceLanguage: "ja",
                targetLanguage: "fr",
                context: text,
              }),
            });
            const data: unknown = await response.json();

            if (!response.ok || typeof data !== "object" || data === null || !("result" in data)) {
              throw new Error("translate failed");
            }

            return { position: token.position, result: data.result as TranslationResult };
          } finally {
            done += 1;
            setBulkProgress({ done, total: selectedTokens.length });
          }
        }),
      );

      const succeeded = results.filter(
        (result): result is PromiseFulfilledResult<{ position: number; result: TranslationResult }> =>
          result.status === "fulfilled",
      );

      setTokenTranslations((current) => {
        const next = { ...current };
        for (const { value } of succeeded) {
          next[value.position] = value.result;
        }
        return next;
      });

      const failedCount = results.length - succeeded.length;

      if (succeeded.length > 0) {
        showToast(`${succeeded.length} mot(s) traduit(s).`);
      }
      if (failedCount > 0) {
        showToast(`${failedCount} mot(s) n'ont pas pu être traduits.`, "error");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant la traduction groupée.",
      );
    } finally {
      setIsBulkTranslating(false);
      setBulkProgress(null);
    }
  }

  // Ajoute les mots cochés au deck, avec leur traduction (voir plus bas).
  async function handleAddSelectionToDeck() {
    const selectedTokens = visibleTokens.filter((token) => selectedTokenPositions.has(token.position));

    if (selectedTokens.length === 0) {
      return;
    }

    setIsAddingSelectionToDeck(true);
    setError(null);
    setBulkProgress({ done: 0, total: selectedTokens.length });

    try {
      const currentDeckId = await ensureDeckId();
      let done = 0;

      const results = await Promise.allSettled(
        selectedTokens.map(async (token) => {
          try {
            // Réutilise la traduction déjà affichée sur la carte ; sinon le serveur
            // traduit automatiquement le mot à l'ajout.
            const meaning = tokenTranslations[token.position]?.translation ?? null;

            const response = await fetch(`/api/decks/${currentDeckId}/cards`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lemma: token.baseForm || token.surface,
                surface: token.surface,
                reading: token.reading,
                meaning,
                sourceTextId: selectedSourceTextId,
                position: token.position,
              }),
            });
            const data: unknown = await response.json();

            if (!response.ok || typeof data !== "object" || data === null) {
              throw new Error("add failed");
            }

            return data as { alreadyExisted: boolean };
          } finally {
            done += 1;
            setBulkProgress({ done, total: selectedTokens.length });
          }
        }),
      );

      const succeeded = results.filter(
        (result): result is PromiseFulfilledResult<{ alreadyExisted: boolean }> =>
          result.status === "fulfilled",
      );
      const newCount = succeeded.filter((result) => !result.value.alreadyExisted).length;
      const alreadyCount = succeeded.length - newCount;
      const failedCount = results.length - succeeded.length;

      await fetchDecks();

      const parts: string[] = [];
      if (newCount > 0) {
        parts.push(`${newCount} nouveau(x)`);
      }
      if (alreadyCount > 0) {
        parts.push(`${alreadyCount} déjà présent(s)`);
      }
      if (parts.length > 0) {
        setLastAddedDeckId(currentDeckId);
        showToast(`${parts.join(", ")} ajouté(s) au deck avec traduction.`);
      }
      if (failedCount > 0) {
        showToast(`${failedCount} mot(s) n'ont pas pu être ajoutés.`, "error");
      }

      setSelectedTokenPositions(new Set());
      setSelectedToken(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue pendant l'ajout de la sélection.",
      );
    } finally {
      setIsAddingSelectionToDeck(false);
      setBulkProgress(null);
    }
  }

  // Sélecteur du deck de destination (ou création d'un nouveau deck), affiché
  // dans la barre de sélection : c'est lui qui sert à toutes les actions
  // d'ajout (un mot ou plusieurs).
  const deckPicker = isCreatingNewDeck ? (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={newDeckName}
        onChange={(event) => setNewDeckName(event.target.value)}
        placeholder="Nom du nouveau deck"
        aria-label="Nom du nouveau deck"
        autoFocus
        className="min-h-9 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
      />
      <button
        type="button"
        onClick={() => void handleCreateDeckInline()}
        disabled={isCreatingDeck}
        className="primary-button px-3.5! py-2! text-sm!"
      >
        {isCreatingDeck ? "Création..." : "Créer"}
      </button>
      <button
        type="button"
        onClick={() => {
          setIsCreatingNewDeck(false);
          setNewDeckName("");
        }}
        className="link-button text-sm!"
      >
        Annuler
      </button>
    </div>
  ) : decks.length === 0 ? (
    <p className="text-sm text-[var(--muted)]">Ton premier deck, « Mon deck japonais », sera créé automatiquement.</p>
  ) : (
    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
      Ajouter dans
      <select
        value={selectedDeckId ?? ""}
        onChange={(event) => {
          if (event.target.value === "__new__") {
            setIsCreatingNewDeck(true);
            return;
          }
          setSelectedDeckId(event.target.value);
        }}
        className="min-h-9 cursor-pointer rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
      >
        {decks.map((deck) => (
          <option key={deck.id} value={deck.id}>
            {deck.name}
          </option>
        ))}
        <option value="__new__">+ Nouveau deck</option>
      </select>
    </label>
  );

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <TodayPanel />

        <header className="mb-8 fade-in-up">
          <h1 className="text-[var(--ink)]">Colle une réplique, comprends chaque mot</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Une réplique d&apos;anime, une bulle de manga, une chanson : touche un mot pour le comprendre en
            français.
          </p>
          <ol className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Étapes">
            {STEPS.map((label, index) => {
              const step = index + 1;
              const state = step === currentStep ? "step-active" : step < currentStep ? "step-done" : "";

              return (
                <li key={label} className={`step ${state}`} aria-current={step === currentStep ? "step" : undefined}>
                  <span className="step-number">{step < currentStep ? "✓" : step}</span>
                  {label}
                </li>
              );
            })}
          </ol>
        </header>

        <section className="flex flex-col gap-10">
          <form onSubmit={handleSubmit} className="panel fade-in-up flex flex-col">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-[var(--ink)]">Texte japonais</h2>
              {/* Compteur seulement près de la limite : sinon, du bruit. */}
              {text.length > MAX_ANALYSIS_TEXT_LENGTH * 0.8 ? (
                <span className="mono whitespace-nowrap text-xs text-[var(--muted)]">
                  {text.length} / {MAX_ANALYSIS_TEXT_LENGTH}
                </span>
              ) : null}
            </div>

            <label htmlFor="japanese-text" className="sr-only">
              Texte japonais à analyser
            </label>
            <textarea
              id="japanese-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Colle ici ta réplique en japonais…"
              maxLength={MAX_ANALYSIS_TEXT_LENGTH}
              className="min-h-56 flex-1 resize-y border border-[var(--ink)] bg-[var(--paper)] p-4 text-xl leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
              lang="ja"
            />

            <div className="mt-4">
              <button
                type="submit"
                disabled={isLoading || text.trim().length === 0}
                className="primary-button w-full sm:w-auto"
              >
                {isSavingAnalysis ? "Enregistrement..." : isLoading ? "Analyse en cours..." : "Analyser le texte →"}
              </button>
            </div>

            <div className="mt-5 border-t border-dashed border-[var(--line-strong)] pt-4">
              <p className="mb-2.5 text-sm text-[var(--muted)]">Pas de texte sous la main ? Essaie :</p>
              <div className="flex flex-wrap gap-2">
                {GENERATED_SOURCES.slice(0, showMoreSources ? GENERATED_SOURCES.length : FEATURED_SOURCE_COUNT).map((source) => (
                  <button
                    key={source.key}
                    type="button"
                    onClick={() => void handleGenerateSource(source.key)}
                    disabled={loadingSourceKey !== null || isLoading}
                    className="chip"
                  >
                    {loadingSourceKey === source.key ? "Génération..." : source.label}
                  </button>
                ))}
                {showMoreSources ? null : (
                  <button type="button" onClick={() => setShowMoreSources(true)} className="link-button text-sm!">
                    Plus d&apos;idées
                  </button>
                )}
              </div>
            </div>

            {error ? (
              <p className="error-banner mt-4">
                {error}
              </p>
            ) : null}
          </form>

          {tokens.length > 0 || isLoading ? (
          <section className="panel fade-in-up" style={{ animationDelay: "80ms" }} aria-live="polite">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[var(--ink)]">Mots détectés</h2>
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={showParticles}
                    onChange={(event) => setShowParticles(event.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                  Voir は, を, ます…
                </label>
                <span className="count-badge">{visibleTokens.length}</span>
              </div>
            </div>

            {lastAddedDeckId ? (
              <p className="mb-4 text-sm text-[var(--muted)]">
                Mots ajoutés à « {decks.find((deck) => deck.id === lastAddedDeckId)?.name ?? "ton deck"} ».{" "}
                <Link href={`/decks/${lastAddedDeckId}`} className="link-button text-sm!">
                  Réviser maintenant →
                </Link>
              </p>
            ) : null}

            {visibleTokens.length > 0 ? (
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleAddAllTokensToDeck()}
                  disabled={isBulkAdding}
                  className="secondary-button"
                >
                  {isBulkAdding
                    ? `Ajout en cours... ${bulkProgress ? `${bulkProgress.done}/${bulkProgress.total}` : ""}`
                    : `Tout ajouter au deck (${visibleTokens.length})`}
                </button>
              </div>
            ) : null}

            {tokens.length > 0 ? (
              <div className="mb-6 border-l-4 border-[var(--line-strong)] pl-4">
                <p className="eyebrow">Phrase analysée</p>
                <p className="mt-1 line-clamp-3 text-base leading-7 text-[var(--ink)]" lang="ja">
                  {text}
                </p>
                <button
                  type="button"
                  onClick={() => void handleTranslateText()}
                  disabled={isTranslating}
                  className="link-button mt-2"
                >
                  {isTranslating ? "Traduction..." : "Traduire la phrase"}
                </button>
                {textTranslation ? (
                  <div className="mt-3">
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
                <span className="mb-3 text-5xl text-[var(--line)]" lang="ja" aria-hidden="true">あ</span>
                <p className="font-medium text-[var(--ink)]">Les mots apparaîtront ici.</p>
                <p className="mt-1 max-w-md text-sm text-[var(--muted)]">
                  Chacun avec sa lecture, sa forme du dictionnaire, sa catégorie grammaticale et son niveau JLPT.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-2.5 sm:gap-x-10">
                {visibleTokens.map((token) => {
                  const isSelected = selectedToken?.position === token.position;
                  const isChecked = selectedTokenPositions.has(token.position);
                  const tokenTranslation = tokenTranslations[token.position];

                  return (
                    <div
                      key={`${token.position}-${token.surface}`}
                      className={`token-card ${isSelected || isChecked ? "token-card-selected" : ""}`}
                    >
                      <button
                        type="button"
                        aria-pressed={isChecked}
                        onClick={(event) => handleTokenClick(token, event.shiftKey)}
                        className="flex w-full flex-col gap-0.5 text-left"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border text-xs font-bold leading-none transition-colors ${
                              isChecked
                                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                : "border-[var(--ink)] bg-[var(--paper)] text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                          <span className={`ml-auto shrink-0 ${jlptBadgeClass(token.difficulty)}`}>
                            {token.difficulty === "unknown" ? "—" : token.difficulty}
                          </span>
                        </span>
                        {/* Lecture jamais tronquée : c'est elle qui aide à lire le mot. */}
                        <span className="text-sm break-all text-[var(--muted)]" lang="ja">
                          {token.reading ?? "lecture inconnue"}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-2xl font-bold leading-tight text-[var(--ink)]" lang="ja">
                            {token.surface}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                            {token.baseForm && token.baseForm !== token.surface ? (
                              <span lang="ja">→ {token.baseForm}</span>
                            ) : null}
                            <span className="part-of-speech">{translatePartOfSpeech(token.partOfSpeech)}</span>
                            {addedLemmas.has(token.baseForm || token.surface) ? (
                              <span className="font-semibold text-[var(--accent-dark)]">déjà dans un deck</span>
                            ) : null}
                          </span>
                          {tokenTranslation ? (
                            <span className="mt-1 block text-sm font-medium text-[var(--ink)]">
                              {tokenTranslation.translation}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedToken ? (
              // Collé en bas de l'écran : avant, ce panneau apparaissait sous
              // toute la grille de mots, souvent hors de vue sur un long texte,
              // et il fallait défiler pour trouver "Traduire"/"Ajouter au deck".
              <div
                className="fade-in-up sticky bottom-3 z-20 mt-8 max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] p-5 shadow-[0_12px_40px_-12px_rgb(0_0_0_/_0.35)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="eyebrow">
                    {selectedTokenPositions.size > 1
                      ? `${selectedTokenPositions.size} mots sélectionnés`
                      : "Mot sélectionné"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTokenPositions(new Set());
                      setSelectedToken(null);
                    }}
                    aria-label="Fermer et tout désélectionner"
                    className="-mt-1 -mr-1 grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--tint)] hover:text-[var(--ink)]"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1 text-3xl font-bold text-[var(--ink)]" lang="ja">
                  {selectedToken.surface}
                  {selectedToken.baseForm && selectedToken.baseForm !== selectedToken.surface ? (
                    <span className="ml-3 text-lg font-medium text-[var(--muted)]">→ {selectedToken.baseForm}</span>
                  ) : null}
                </p>

                <div className="mt-2 flex items-center gap-3 text-sm text-[var(--muted)]">
                  <span>
                    Niveau JLPT{" "}
                    <span className={jlptBadgeClass(selectedToken.difficulty)}>
                      {selectedToken.difficulty === "unknown" ? "—" : selectedToken.difficulty}
                    </span>
                  </span>
                  {addedLemmas.has(selectedToken.baseForm || selectedToken.surface) ? (
                    <span className="font-semibold text-[var(--accent-dark)]">déjà dans un deck</span>
                  ) : null}
                </div>

                {selectedTokenPositions.size <= 1 ? (
                  translation ? (
                    <div className="fade-in-up mt-3 border-l-4 border-[var(--accent)] pl-4">
                      <p className="text-xl font-semibold text-[var(--ink)]">{translation.translation}</p>
                      {/* Explication repliée : dépliée, le panneau couvrait tout l'écran du téléphone. */}
                      <details className="mt-1 text-sm text-[var(--muted)]">
                        <summary className="cursor-pointer hover:text-[var(--ink)]">Pourquoi ce sens ?</summary>
                        <p className="mt-1 leading-6">{translation.explanation}</p>
                      </details>
                    </div>
                  ) : isTranslating ? (
                    <div className="skeleton mt-3 h-12 w-2/3" aria-label="Traduction en cours" />
                  ) : null
                ) : null}

                <div className="mt-3">{deckPicker}</div>

                {/* Avec plusieurs mots cochés, les boutons agissent sur TOUTE la
                    sélection (et pas seulement sur le mot affiché ici). */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {selectedTokenPositions.size > 1 ? (
                    <button
                      type="button"
                      onClick={() => void handleTranslateSelection()}
                      disabled={isBulkTranslating || isAddingSelectionToDeck}
                      className="primary-button"
                    >
                      {isBulkTranslating
                        ? `Traduction... ${bulkProgress ? `${bulkProgress.done}/${bulkProgress.total}` : ""}`
                        : `Traduire les ${selectedTokenPositions.size} mots`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleTranslateToken(selectedToken)}
                      disabled={isTranslating}
                      className="secondary-button"
                    >
                      {isTranslating ? "Traduction..." : "Sens dans cette phrase"}
                    </button>
                  )}

                  {selectedTokenPositions.size > 1 ? (
                    <button
                      type="button"
                      onClick={() => void handleAddSelectionToDeck()}
                      disabled={isBulkTranslating || isAddingSelectionToDeck}
                      className="primary-button"
                    >
                      {isAddingSelectionToDeck
                        ? `Ajout... ${bulkProgress ? `${bulkProgress.done}/${bulkProgress.total}` : ""}`
                        : `Ajouter les ${selectedTokenPositions.size} mots au deck`}
                    </button>
                  ) : (
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
                  )}

                  {selectedTokenPositions.size > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTokenPositions(new Set());
                        setSelectedToken(null);
                      }}
                      className="link-button"
                    >
                      Désélectionner tout
                    </button>
                  ) : null}
                </div>

              </div>
            ) : null}
          </section>
          ) : null}
        </section>

        {recentSourceTexts.length > 0 ? (
          <section className="panel mt-12">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-[var(--ink)]">Derniers textes</h2>
              <Link href="/historique" className="link-button text-sm!">
                Tout l&apos;historique →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 md:gap-x-10">
              {recentSourceTexts.map((sourceText) => (
                <button
                  key={sourceText.id}
                  type="button"
                  onClick={() => void loadTokensForText(sourceText.id)}
                  className={`token-card text-left ${selectedSourceTextId === sourceText.id ? "token-card-selected" : ""}`}
                >
                  <time className="mono text-xs text-[var(--muted)]" dateTime={sourceText.createdAt}>
                    {new Date(sourceText.createdAt).toLocaleDateString("fr-FR")}
                  </time>
                  {sourceText.title ? (
                    <p className="mt-0.5 text-xs font-medium text-[var(--accent-dark)]">{sourceText.title}</p>
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-base leading-7 text-[var(--ink)]" lang="ja">
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
