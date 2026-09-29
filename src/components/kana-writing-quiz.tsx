"use client";

import { useState } from "react";

import { ProgressBar } from "@/components/progress-bar";
import { WritingCanvas } from "@/components/writing-canvas";
import { authClient } from "@/lib/auth/auth-client";
import { KANA_GROUP_LABELS, type KanaEntry, type KanaGroup } from "@/lib/kana/kana";
import { shuffle } from "@/lib/shuffle";
import { WRITABLE_KANA, isWritingSuccess, type WritingResult } from "@/lib/writing/writing";

type ScriptChoice = "hiragana" | "katakana" | "both";

const SCRIPT_CHOICES: Array<{ value: ScriptChoice; label: string }> = [
  { value: "hiragana", label: "Hiragana" },
  { value: "katakana", label: "Katakana" },
  { value: "both", label: "Les deux" },
];
// Pas de combinés : ils s'écrivent avec deux kana déjà travaillés.
const GROUPS: KanaGroup[] = ["base", "dakuten"];
const SERIES_LENGTH = 10;

// Exercice d'écriture des kana : le son s'affiche (ex. « ka » en hiragana),
// l'élève dessine le kana trait par trait. Séries de 10 pour tenir en
// quelques minutes dans le métro.
export function KanaWritingQuiz() {
  const { data: session } = authClient.useSession();
  const [scriptChoice, setScriptChoice] = useState<ScriptChoice>("hiragana");
  const [group, setGroup] = useState<KanaGroup>("base");
  const [queue, setQueue] = useState<KanaEntry[]>([]);
  const [position, setPosition] = useState(0);
  const [result, setResult] = useState<WritingResult | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const pool = WRITABLE_KANA.filter(
    (entry) => (scriptChoice === "both" || entry.script === scriptChoice) && entry.group === group,
  );
  const current = queue[position];
  const isFinished = queue.length > 0 && position >= queue.length;

  function start() {
    setQueue(shuffle(pool).slice(0, SERIES_LENGTH));
    setPosition(0);
    setResult(null);
    setSuccessCount(0);
  }

  function reset() {
    setQueue([]);
    setPosition(0);
    setResult(null);
  }

  function handleComplete(entry: KanaEntry, written: WritingResult) {
    setResult(written);

    // Avec le modèle affiché, c'est de l'entraînement : rien d'enregistré.
    if (written.assisted) {
      return;
    }

    const success = isWritingSuccess(written);
    if (success) {
      setSuccessCount((value) => value + 1);
    }

    if (session) {
      void fetch("/api/exercise-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "kana-writing", focus: entry.kana, correct: success }),
      }).catch(() => undefined);
    }
  }

  function handleNext() {
    setResult(null);
    setPosition((value) => value + 1);
  }

  const chipClass = (isActive: boolean) =>
    `chip ${isActive ? "border-[var(--accent)]! bg-[var(--accent)]! text-white!" : ""}`;

  return (
    <section className="panel">
      <p className="mb-4 text-sm text-[var(--muted)]">
        Lis le son, puis dessine le kana trait par trait, dans le bon ordre. Au doigt sur téléphone, à la souris sur
        ordinateur.
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Écriture">
        {SCRIPT_CHOICES.map((choice) => (
          <button
            key={choice.value}
            type="button"
            aria-pressed={scriptChoice === choice.value}
            onClick={() => {
              setScriptChoice(choice.value);
              reset();
            }}
            className={chipClass(scriptChoice === choice.value)}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Groupe de kana">
        {GROUPS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            aria-pressed={group === candidate}
            onClick={() => {
              setGroup(candidate);
              reset();
            }}
            className={chipClass(group === candidate)}
          >
            {KANA_GROUP_LABELS[candidate]}
          </button>
        ))}
      </div>

      {queue.length === 0 ? (
        <button type="button" onClick={start} className="primary-button">
          Commencer ({Math.min(SERIES_LENGTH, pool.length)} kana) →
        </button>
      ) : isFinished ? (
        <div className="fade-in-up rounded-2xl border border-[var(--line)] bg-[var(--tint)] p-5 text-center">
          <p className="text-lg font-semibold text-[var(--ink)]">Série terminée !</p>
          <p className="mono mt-1 text-3xl font-bold text-[var(--ink)]">
            {successCount} / {queue.length}
          </p>
          <div className="mx-auto mt-3 max-w-xs">
            <ProgressBar rate={successCount / queue.length} />
          </div>
          <button type="button" onClick={start} className="primary-button mt-4">
            Nouvelle série
          </button>
        </div>
      ) : current ? (
        <div>
          <div className="mb-3 flex items-baseline justify-between text-xs text-[var(--muted)]">
            <span>
              {position + 1} / {queue.length}
            </span>
            <span className="mono">
              {successCount} réussi{successCount > 1 ? "s" : ""}
            </span>
          </div>
          <div className="mb-4">
            <ProgressBar rate={position / queue.length} />
          </div>

          <p className="mb-4 text-center">
            <span className="eyebrow block">Écris en {current.script}</span>
            <span className="text-5xl font-bold text-[var(--accent-dark)]">{current.romaji}</span>
          </p>

          <WritingCanvas
            key={current.kana + position}
            character={current.kana}
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
                {result.assisted
                  ? "Entraînement avec le modèle (non compté)"
                  : result.mistakes === 0
                    ? "Parfait !"
                    : isWritingSuccess(result)
                      ? "Réussi, avec une petite erreur"
                      : `${result.mistakes} erreurs : à retravailler`}
              </p>
              <button type="button" onClick={handleNext} className="primary-button mt-3">
                Suivant →
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
