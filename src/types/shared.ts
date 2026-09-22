import type { JLPTLevel } from "@/lib/difficulty/classify";

export type SourceTextSummary = {
  id: string;
  content: string;
  title: string | null;
  createdAt: string;
};

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

export type DeckSummary = {
  id: string;
  name: string;
  description?: string | null;
  cards: DeckCard[];
};

export type DeckCardWithOccurrences = {
  id: string;
  lemma: string;
  reading?: string | null;
  meaning?: string | null;
  occurrences: Array<{ id: string; sourceText: { id: string; title: string | null; content: string } | null }>;
};

export type DeckStats = {
  totalCards: number;
  dueCards: number;
  totalReviews: number;
  successRate: number | null;
  recentReviews: Array<{ id: string; lemma: string; quality: number; reviewedAt: string }>;
};

export type VocabularyEntry = {
  lemma: string;
  occurrenceCount: number;
  reading?: string | null;
  partOfSpeech?: string | null;
  difficulty?: JLPTLevel;
};

export type TranslationResult = {
  translation: string;
  explanation: string;
  difficulty: JLPTLevel;
};
