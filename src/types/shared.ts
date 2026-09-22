// Types partagés entre les différentes pages du site (front-end), pour ne
// pas redéfinir la même forme de données plusieurs fois.
import type { JLPTLevel } from "@/lib/difficulty/classify";

// Un texte source déjà analysé, tel qu'affiché dans l'historique.
export type SourceTextSummary = {
  id: string;
  content: string;
  title: string | null;
  createdAt: string;
};

// Une carte telle que renvoyée avec la liste des decks (sans le détail des occurrences).
export type DeckCard = {
  id: string;
  lemma: string;
  reading?: string | null;
  meaning?: string | null;
  dueAt?: string | null;
  imageUrl?: string | null;
  imageAttribution?: string | null;
  audioCacheId?: string | null;
};

// Un deck avec toutes ses cartes.
export type DeckSummary = {
  id: string;
  name: string;
  description?: string | null;
  cards: DeckCard[];
};

// Une carte avec la liste des textes où le mot a été rencontré (pour le
// mode d'entraînement "Contexte" et la gestion des cartes d'un deck).
export type DeckCardWithOccurrences = {
  id: string;
  lemma: string;
  reading?: string | null;
  meaning?: string | null;
  occurrences: Array<{ id: string; sourceText: { id: string; title: string | null; content: string } | null }>;
};

// Les statistiques de révision d'un deck.
export type DeckStats = {
  totalCards: number;
  dueCards: number;
  totalReviews: number;
  successRate: number | null;
  recentReviews: Array<{ id: string; lemma: string; quality: number; reviewedAt: string }>;
};

// Un mot du vocabulaire global, avec son nombre d'occurrences.
export type VocabularyEntry = {
  lemma: string;
  occurrenceCount: number;
  reading?: string | null;
  partOfSpeech?: string | null;
  difficulty?: JLPTLevel;
};

// Le résultat d'une traduction renvoyé par l'API.
export type TranslationResult = {
  translation: string;
  explanation: string;
  difficulty: JLPTLevel;
};
