"use client";

import { useState } from "react";

import { FilterChips } from "@/components/reference-toolbar";
import { useToast } from "@/components/toast-provider";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";
import { jlptBadgeClass } from "@/lib/jlpt-badge";

type Exercise = { id: string; french: string; level: string | null; focus: string; hint?: string };

type ExerciseError = { wrong: string; right: string; explanation: string };

type Correction = {
  verdict: "correct" | "almost" | "incorrect";
  corrected: string;
  summary: string;
  errors: ExerciseError[];
};

export type Source = "grammar" | "examples" | "conjugation" | "kanji" | "kanji-reading";

const VERDICT_STYLES: Record<Correction["verdict"], string> = {
  correct: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success-dark)]",
  almost: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning-dark)]",
  incorrect: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]",
};

const VERDICT_LABELS: Record<Correction["verdict"], string> = {
  correct: "Correct",
  almost: "Presque",
  incorrect: "À revoir",
};

const VERDICT_ICONS: Record<Correction["verdict"], string> = {
  correct: "✓",
  almost: "~",
  incorrect: "✗",
};

// Exercice d'écriture : Claude propose une phrase française à traduire en
// japonais (issue des points de grammaire, du vocabulaire des decks, du
// référentiel de conjugaison ou d'un kanji), l'élève écrit sa traduction,
// puis Claude la corrige en expliquant chaque erreur. Un composant client
// autonome, une instance par type sur ses propres sous-pages (/exercices/...),
// chacune avec un source fixe et son propre sélecteur de niveau JLPT.
// focusIn (optionnel) restreint le tirage aux points/formes/kanji/mots
// listés, utilisé par /exercices/revision pour s'entraîner sur les points
// faibles remontés par les statistiques.
export function TranslationExercise({ source, focusIn }: { source: Source; focusIn?: string[] }) {
  const { showToast } = useToast();
  // Kanji : sens en français ("kanji") ou lecture en kana ("kanji-reading"),
  // corrigés localement sans Claude.
  const isKanji = source === "kanji" || source === "kanji-reading";
  const isReading = source === "kanji-reading";

  const [level, setLevel] = useState<GrammarLevel | "all">("all");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [correction, setCorrection] = useState<{ correction: Correction; reference: string } | null>(null);
  const [isLoadingExercise, setIsLoadingExercise] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function loadExercise(nextLevel: GrammarLevel | "all", excludeIds: string[]) {
    setIsLoadingExercise(true);
    setInfo(null);
    setCorrection(null);
    setAnswer("");

    try {
      const response = await fetch("/api/grammar/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, level: nextLevel, excludeIds, focusIn }),
      });
      const data = (await response.json()) as { exercise: Exercise | null; message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "exercise failed");
      }

      if (!data.exercise) {
        setExercise(null);
        setInfo(data.message ?? "Aucun exercice disponible.");
        return;
      }

      setExercise(data.exercise);
      setSeenIds((previous) => [...previous, data.exercise!.id]);
    } catch (error) {
      showToast(
        error instanceof Error && error.message !== "exercise failed"
          ? error.message
          : "Impossible de charger un exercice.",
        "error",
      );
    } finally {
      setIsLoadingExercise(false);
    }
  }

  function handleStart() {
    setSeenIds([]);
    void loadExercise(level, []);
  }

  function handleLevelChange(nextLevel: GrammarLevel | "all") {
    setLevel(nextLevel);
    setSeenIds([]);

    // Ne relance un exercice que si une session est déjà en cours : sinon, le
    // niveau choisi ne s'applique qu'au prochain "Commencer".
    if (exercise || info) {
      void loadExercise(nextLevel, []);
    }
  }

  async function handleSubmit() {
    if (!exercise || !answer.trim()) {
      return;
    }

    setIsCorrecting(true);

    try {
      const response = await fetch("/api/grammar/exercises/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, answer: answer.trim() }),
      });
      const data = (await response.json()) as {
        correction?: Correction;
        reference?: string;
        error?: string;
      };

      if (!response.ok || !data.correction || !data.reference) {
        throw new Error(data.error ?? "correction failed");
      }

      setCorrection({ correction: data.correction, reference: data.reference });
    } catch (error) {
      showToast(
        error instanceof Error && error.message !== "correction failed"
          ? error.message
          : "La correction a échoué.",
        "error",
      );
    } finally {
      setIsCorrecting(false);
    }
  }

  return (
    <section className="panel">
      {/* Pas de titre ici : chaque page qui affiche ce composant nomme déjà
          l'exercice (titre de sous-page, ou libellé de section en révision). */}
      <p className="mb-4 text-sm text-[var(--muted)]">
        {isReading
          ? "Regarde le kanji, écris une de ses lectures en hiragana ou en katakana."
          : isKanji
            ? "Regarde le kanji, écris son sens en français."
            : "Écris ta traduction en japonais, Claude la corrige."}
      </p>

      <div className="mb-4">
        <FilterChips
          options={[
            { value: "all" as const, label: "Tous niveaux" },
            ...GRAMMAR_LEVELS.map((candidate) => ({ value: candidate, label: candidate })),
          ]}
          value={level}
          onChange={handleLevelChange}
          label="Niveau JLPT de l'exercice"
        />
      </div>

      <div className="mb-5">
        <button
          type="button"
          onClick={handleStart}
          className={exercise || info ? "secondary-button" : "primary-button"}
        >
          {exercise || info ? "Nouvelle phrase" : "Commencer →"}
        </button>
      </div>

      {isLoadingExercise ? <div className="skeleton h-36 rounded-2xl" aria-label="Préparation de la phrase" /> : null}

      {!isLoadingExercise && info ? <div className="empty-state">{info}</div> : null}

      {!isLoadingExercise && exercise ? (
        <div>
          {/* key = exercice : l'animation d'entrée rejoue à chaque nouvelle phrase. */}
          <div
            key={exercise.id}
            className={`fade-in-up rounded-2xl border border-[var(--line)] bg-[var(--tint)] p-5 ${isKanji ? "text-center" : ""}`}
          >
            <div className={`flex flex-wrap items-center gap-2 ${isKanji ? "justify-center" : ""}`}>
              <span className="eyebrow">
                {isReading ? "Comment se lit ce kanji ?" : isKanji ? "Que veut dire ce kanji ?" : "À traduire en japonais"}
              </span>
              {exercise.level ? <span className={jlptBadgeClass(exercise.level)}>{exercise.level}</span> : null}
            </div>
            <p
              className={
                isKanji ? "mt-3 text-6xl font-bold text-[var(--ink)]" : "mt-2 text-xl font-semibold leading-snug text-[var(--ink)]"
              }
              lang={isKanji ? "ja" : undefined}
            >
              {exercise.french}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]" lang={isKanji && !isReading ? "ja" : undefined}>
              {exercise.hint ?? `Point travaillé : ${exercise.focus}`}
            </p>
          </div>

          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={isReading ? "ひらがな ou カタカナ" : isKanji ? "Écris le sens en français" : "日本語で書いてみよう"}
            lang={isKanji && !isReading ? "fr" : "ja"}
            rows={3}
            className="mt-4 min-h-24 w-full border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-3 text-lg text-[var(--ink)] outline-none"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isCorrecting || !answer.trim()}
              className="primary-button"
            >
              {isCorrecting ? "Correction..." : isKanji ? "Vérifier ma réponse" : "Corriger ma traduction"}
            </button>
            <span className="text-xs text-[var(--muted)]">
              <span className="kbd">Ctrl</span> + <span className="kbd">Entrée</span> pour envoyer
            </span>
            <button
              type="button"
              onClick={() => void loadExercise(level, seenIds)}
              disabled={isLoadingExercise}
              className="link-button"
            >
              Passer cette phrase
            </button>
          </div>

          {correction ? (
            <div className={`fade-in-up mt-4 rounded-2xl border p-4 ${VERDICT_STYLES[correction.correction.verdict]}`}>
              <p className="flex items-center gap-2 text-base font-bold">
                <span
                  className="grid h-6 w-6 place-items-center rounded-full border-2 border-current text-xs"
                  aria-hidden="true"
                >
                  {VERDICT_ICONS[correction.correction.verdict]}
                </span>
                {VERDICT_LABELS[correction.correction.verdict]}
              </p>
              <p className="mt-1 text-sm">{correction.correction.summary}</p>

              {correction.correction.errors.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {correction.correction.errors.map((entry, index) => (
                    <li key={index} className="rounded-lg bg-[var(--paper)] p-3 text-sm text-[var(--ink)]">
                      <p>
                        <span lang={isKanji ? undefined : "ja"} className="line-through opacity-70">
                          {entry.wrong}
                        </span>{" "}
                        →{" "}
                        <span lang={isKanji ? undefined : "ja"} className="font-semibold">
                          {entry.right}
                        </span>
                      </p>
                      <p className="mt-1 text-[var(--muted)]">{entry.explanation}</p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {isKanji ? (
                // Sur une mauvaise réponse, l'erreur ci-dessus montre déjà le
                // sens attendu ; sur une bonne, on rappelle tous les synonymes.
                correction.correction.verdict === "correct" ? (
                  <p className="mt-3 text-sm text-[var(--ink)]">
                    <span className="font-semibold">{isReading ? "Lectures : " : "Sens attendu : "}</span>
                    <span lang={isReading ? "ja" : undefined}>{correction.reference}</span>
                  </p>
                ) : null
              ) : (
                <>
                  <p className="mt-3 text-sm text-[var(--ink)]">
                    <span className="font-semibold">Ta traduction corrigée : </span>
                    <span lang="ja">{correction.correction.corrected}</span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    <span className="font-semibold">Référence : </span>
                    <span lang="ja">{correction.reference}</span>
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
