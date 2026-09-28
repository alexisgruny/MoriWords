"use client";

import { useState } from "react";

import { useToast } from "@/components/toast-provider";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";

type Exercise = { id: string; french: string; level: string | null; focus: string };

type ExerciseError = { wrong: string; right: string; explanation: string };

type Correction = {
  verdict: "correct" | "almost" | "incorrect";
  corrected: string;
  summary: string;
  errors: ExerciseError[];
};

export type Source = "grammar" | "examples" | "conjugation" | "kanji";

const SOURCE_LABELS: Record<Source, string> = {
  grammar: "grammaire",
  examples: "mon vocabulaire",
  conjugation: "conjugaison",
  kanji: "kanji",
};

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

// Exercice d'écriture : Claude propose une phrase française à traduire en
// japonais (issue des points de grammaire, du vocabulaire des decks, du
// référentiel de conjugaison ou d'un kanji), l'élève écrit sa traduction,
// puis Claude la corrige en expliquant chaque erreur. Un composant client
// autonome, une instance par type sur ses propres sous-pages (/exercices/...),
// chacune avec un source fixe et son propre sélecteur de niveau JLPT.
export function TranslationExercise({ source }: { source: Source }) {
  const { showToast } = useToast();
  const isKanji = source === "kanji";

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
        body: JSON.stringify({ source, level: nextLevel, excludeIds }),
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
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-[var(--ink)]">
          {source === "examples" ? "Exercice sur mon vocabulaire" : `Exercice de ${SOURCE_LABELS[source]}`}
        </h2>
        <p className="text-sm text-[var(--muted)]">
          {isKanji ? "Regarde le kanji, écris son sens en français." : "Écris ta traduction en japonais, Claude la corrige."}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Niveau JLPT de l'exercice">
        <button
          type="button"
          onClick={() => handleLevelChange("all")}
          aria-pressed={level === "all"}
          className={`rounded-sm border px-3.5 py-1.5 text-sm font-medium transition ${
            level === "all"
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
              : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
          }`}
        >
          Tous niveaux
        </button>
        {GRAMMAR_LEVELS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => handleLevelChange(candidate)}
            aria-pressed={level === candidate}
            className={`rounded-sm border px-3.5 py-1.5 text-sm font-medium transition ${
              level === candidate
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]"
            }`}
          >
            {candidate}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <button type="button" onClick={handleStart} className="secondary-button">
          {exercise || info ? "Nouvelle phrase" : "Commencer"}
        </button>
      </div>

      {isLoadingExercise ? <p className="text-sm text-[var(--muted)]">Préparation de la phrase...</p> : null}

      {!isLoadingExercise && info ? <div className="empty-state">{info}</div> : null}

      {!isLoadingExercise && exercise ? (
        <div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--tint)] p-4">
            <p className="eyebrow">
              {isKanji ? "Que veut dire ce kanji ?" : "À traduire en japonais"}
              {exercise.level ? ` · niveau ${exercise.level}` : ""}
              {isKanji ? ` · lectures : ${exercise.focus}` : ` · ${exercise.focus}`}
            </p>
            <p
              className={isKanji ? "mt-1 text-4xl font-bold text-[var(--ink)]" : "mt-1 text-lg font-semibold text-[var(--ink)]"}
              lang={isKanji ? "ja" : undefined}
            >
              {exercise.french}
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
            placeholder={isKanji ? "Écris le sens en français" : "日本語で書いてみよう"}
            lang={isKanji ? "fr" : "ja"}
            rows={3}
            className="mt-4 min-h-24 w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-lg text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
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
            <span className="text-xs text-[var(--muted)]">Ctrl/Cmd + Entrée pour envoyer</span>
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
            <div className={`mt-4 rounded-2xl border p-4 ${VERDICT_STYLES[correction.correction.verdict]}`}>
              <p className="text-sm font-semibold">{VERDICT_LABELS[correction.correction.verdict]}</p>
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
                <p className="mt-3 text-sm text-[var(--ink)]">
                  <span className="font-semibold">Sens attendu : </span>
                  {correction.reference}
                </p>
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
