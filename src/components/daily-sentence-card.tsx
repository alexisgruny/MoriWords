"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { JapaneseText } from "@/components/japanese-text";
import { FilterChips } from "@/components/reference-toolbar";
import { SpeakButton } from "@/components/speak-button";
import { dailySentence } from "@/lib/daily/daily-sentence";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";

// Niveau choisi, gardé dans ce navigateur (simple confort d'affichage).
const STORAGE_KEY = "moriwords-daily-level";
const CHANGE_EVENT = "moriwords-daily-level";

function readLevel(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "N5";
  } catch {
    return "N5";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function saveLevel(level: GrammarLevel) {
  try {
    window.localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // Stockage indisponible : le choix vaut pour cette visite seulement.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Phrase du jour : une phrase courte à lire, écouter et comprendre chaque
// jour (voir src/lib/daily/daily-sentence.ts). Rien côté serveur : la date
// et le niveau viennent du navigateur.
export function DailySentenceCard() {
  const stored = useSyncExternalStore(subscribe, readLevel, () => null);
  const [isRevealed, setIsRevealed] = useState(false);
  // Niveau choisi pendant cette visite si le stockage est indisponible.
  const [fallbackLevel, setFallbackLevel] = useState<GrammarLevel>("N5");

  if (stored === null) {
    return null;
  }
  const level = (GRAMMAR_LEVELS as string[]).includes(stored) ? (stored as GrammarLevel) : fallbackLevel;
  const sentence = dailySentence(level, new Date());

  function changeLevel(next: GrammarLevel) {
    setFallbackLevel(next);
    setIsRevealed(false);
    saveLevel(next);
  }

  return (
    <section className="panel fade-in-up mb-8" aria-labelledby="daily-sentence-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="daily-sentence-title" className="text-lg font-bold text-[var(--ink)]">
          Phrase du jour
        </h2>
        <FilterChips
          options={GRAMMAR_LEVELS.map((candidate) => ({ value: candidate, label: candidate }))}
          value={level}
          onChange={changeLevel}
          label="Niveau de la phrase du jour"
        />
      </div>

      <div className="mt-3 flex items-start gap-3">
        <div className="min-w-0 flex-1 text-2xl leading-relaxed text-[var(--ink)]" lang="ja">
          <JapaneseText key={sentence.ja} text={sentence.ja} interactive />
        </div>
        <SpeakButton text={sentence.ja} label="Écouter la phrase du jour" />
      </div>

      {isRevealed ? (
        <p className="fade-in-up mt-2 text-[var(--ink)]">
          {sentence.fr}
          <span className="mt-0.5 block text-sm text-[var(--muted)]">Grammaire : {sentence.pattern}</span>
        </p>
      ) : (
        <button type="button" onClick={() => setIsRevealed(true)} className="link-button mt-2 text-sm!">
          Essaie de comprendre, puis voir la traduction
        </button>
      )}

      <p className="mt-3 text-sm">
        <Link href={`/?texte=${encodeURIComponent(sentence.ja)}`} className="link-button text-sm!">
          Analyser cette phrase mot à mot →
        </Link>
      </p>
    </section>
  );
}
