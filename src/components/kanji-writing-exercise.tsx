"use client";

import { useState } from "react";

import { AddKanjiToDeck } from "@/components/add-kanji-to-deck";
import { FilterChips } from "@/components/reference-toolbar";
import { WritingCanvas } from "@/components/writing-canvas";
import { authClient } from "@/lib/auth/auth-client";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";
import { jlptBadgeClass } from "@/lib/jlpt-badge";
import { JLPT_KANJI, type KanjiEntry } from "@/lib/kanji/kanji";
import { shuffle } from "@/lib/shuffle";
import { isWritingSuccess, type WritingResult } from "@/lib/writing/writing";

// Exercice d'écriture des kanji : le sens et les lectures s'affichent,
// l'élève dessine le kanji trait par trait (tirage au hasard par niveau).
export function KanjiWritingExercise() {
  const { data: session } = authClient.useSession();
  const [level, setLevel] = useState<GrammarLevel | "all">("N5");
  const [current, setCurrent] = useState<KanjiEntry | null>(null);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<WritingResult | null>(null);

  function pickNext(nextLevel: GrammarLevel | "all" = level) {
    const pool = JLPT_KANJI.filter((entry) => nextLevel === "all" || entry.level === nextLevel);
    const candidates = pool.filter((entry) => entry.kanji !== current?.kanji);
    setCurrent(shuffle(candidates)[0] ?? null);
    setRound((value) => value + 1);
    setResult(null);
  }

  function handleLevelChange(nextLevel: GrammarLevel | "all") {
    setLevel(nextLevel);
    if (current) {
      pickNext(nextLevel);
    }
  }

  function handleComplete(entry: KanjiEntry, written: WritingResult) {
    setResult(written);

    // Avec le modèle affiché, c'est de l'entraînement : rien d'enregistré.
    if (written.assisted || !session) {
      return;
    }

    void fetch("/api/exercise-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "kanji-writing", focus: entry.kanji, correct: isWritingSuccess(written) }),
    }).catch(() => undefined);
  }

  return (
    <section className="panel">
      <p className="mb-4 text-sm text-[var(--muted)]">
        Lis le sens et les lectures, puis dessine le kanji trait par trait. Bloqué ? Affiche l&apos;ordre des traits
        ou le modèle (l&apos;essai ne compte alors pas).
      </p>

      <div className="mb-4">
        <FilterChips
          options={[
            { value: "all" as const, label: "Tous niveaux" },
            ...GRAMMAR_LEVELS.map((candidate) => ({ value: candidate, label: candidate })),
          ]}
          value={level}
          onChange={handleLevelChange}
          label="Niveau JLPT"
        />
      </div>

      {!current ? (
        <button type="button" onClick={() => pickNext()} className="primary-button">
          Commencer →
        </button>
      ) : (
        <div>
          <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--tint)] p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="eyebrow">Écris le kanji qui veut dire</span>
              <span className={jlptBadgeClass(current.level)}>{current.level}</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--ink)]">{current.meaning}</p>
            <p className="mt-1 text-sm text-[var(--muted)]" lang="ja">
              {[...current.onReadings, ...current.kunReadings].join("・")} · {current.strokeCount} trait
              {current.strokeCount > 1 ? "s" : ""}
            </p>
          </div>

          <WritingCanvas
            key={current.kanji + round}
            character={current.kanji}
            onComplete={(written) => handleComplete(current, written)}
          />

          {result ? (
            <div
              className={`fade-in-up mt-4 rounded-2xl border p-4 text-center ${
                result.assisted
                  ? "border-[var(--line)] bg-[var(--tint)]"
                  : isWritingSuccess(result)
                    ? "border-[var(--success)] bg-[var(--success-soft)]"
                    : "border-[var(--accent)] bg-[var(--accent-soft)]"
              }`}
              role="status"
            >
              <p className="font-bold text-[var(--ink)]">
                <span className="mr-2 text-3xl" lang="ja">
                  {current.kanji}
                </span>
                {result.assisted
                  ? "Entraînement avec le modèle (non compté)"
                  : result.mistakes === 0
                    ? "Parfait !"
                    : isWritingSuccess(result)
                      ? "Réussi, avec une petite erreur"
                      : `${result.mistakes} erreurs : à retravailler`}
              </p>
              <AddKanjiToDeck key={current.kanji} kanji={current.kanji} />
              <button type="button" onClick={() => pickNext()} className="primary-button mt-3">
                Kanji suivant →
              </button>
            </div>
          ) : (
            <p className="mt-3 text-center">
              <button type="button" onClick={() => pickNext()} className="link-button">
                Passer ce kanji
              </button>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
