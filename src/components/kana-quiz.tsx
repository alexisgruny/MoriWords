"use client";

import { FormEvent, useRef, useState } from "react";

import { ProgressBar } from "@/components/progress-bar";
import { authClient } from "@/lib/auth/auth-client";
import { KANA, KANA_GROUP_LABELS, type KanaEntry, type KanaGroup, isCorrectKanaAnswer } from "@/lib/kana/kana";
import { shuffle } from "@/lib/shuffle";

type ScriptChoice = "hiragana" | "katakana" | "both";

const SCRIPT_CHOICES: Array<{ value: ScriptChoice; label: string }> = [
  { value: "hiragana", label: "Hiragana" },
  { value: "katakana", label: "Katakana" },
  { value: "both", label: "Les deux" },
];
const GROUPS: KanaGroup[] = ["base", "dakuten", "combo"];

// Exercice de lecture des kana : un kana s'affiche, l'élève tape son romaji.
// Corrigé localement (une seule lecture possible par kana, variantes comme
// "si"/"shi" acceptées) : ni appel à Claude ni requête serveur.
export function KanaQuiz() {
  const { data: session } = authClient.useSession();
  const [scriptChoice, setScriptChoice] = useState<ScriptChoice>("hiragana");
  const [groups, setGroups] = useState<Set<KanaGroup>>(new Set(["base"]));
  const [queue, setQueue] = useState<KanaEntry[]>([]);
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState("");
  const [lastResult, setLastResult] = useState<{ correct: boolean; entry: KanaEntry } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState<KanaEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const pool = KANA.filter(
    (entry) => (scriptChoice === "both" || entry.script === scriptChoice) && groups.has(entry.group),
  );
  const current = queue[position];
  const isFinished = queue.length > 0 && position >= queue.length;

  function start(entries: KanaEntry[]) {
    setQueue(shuffle(entries));
    setPosition(0);
    setAnswer("");
    setLastResult(null);
    setCorrectCount(0);
    setMissed([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // Changer un réglage arrête la série en cours (elle ne correspondrait plus).
  function resetSession() {
    setQueue([]);
    setPosition(0);
    setLastResult(null);
  }

  function toggleGroup(group: KanaGroup) {
    setGroups((current) => {
      const next = new Set(current);
      if (next.has(group) && next.size > 1) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
    resetSession();
  }

  // Entrée valide la réponse, puis une seconde fois passe au kana suivant.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!current) {
      return;
    }

    if (lastResult) {
      setLastResult(null);
      setAnswer("");
      setPosition((value) => value + 1);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }

    if (!answer.trim()) {
      return;
    }

    const correct = isCorrectKanaAnswer(current, answer);
    setLastResult({ correct, entry: current });

    // Trace pour les statistiques et les couleurs de la page Kana, seulement
    // avec un compte (le quiz reste ouvert à tous). Un échec n'a pas d'effet.
    if (session) {
      void fetch("/api/exercise-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "kana", focus: current.kana, correct }),
      }).catch(() => undefined);
    }

    if (correct) {
      setCorrectCount((value) => value + 1);
    } else {
      setMissed((list) => (list.some((entry) => entry.kana === current.kana) ? list : [...list, current]));
    }
  }

  const chipClass = (isActive: boolean) =>
    `chip ${isActive ? "border-[var(--accent)]! bg-[var(--accent)]! text-white!" : ""}`;

  return (
    <section className="panel">
      <p className="mb-4 text-sm text-[var(--muted)]">Regarde le kana et tape sa prononciation en romaji.</p>

      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Écriture">
        {SCRIPT_CHOICES.map((choice) => (
          <button
            key={choice.value}
            type="button"
            aria-pressed={scriptChoice === choice.value}
            onClick={() => {
              setScriptChoice(choice.value);
              resetSession();
            }}
            className={chipClass(scriptChoice === choice.value)}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Groupes de kana">
        {GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            aria-pressed={groups.has(group)}
            onClick={() => toggleGroup(group)}
            className={chipClass(groups.has(group))}
          >
            {KANA_GROUP_LABELS[group]}
          </button>
        ))}
      </div>

      {queue.length === 0 ? (
        <button type="button" onClick={() => start(pool)} className="primary-button">
          Commencer ({pool.length} kana) →
        </button>
      ) : isFinished ? (
        <div className="fade-in-up rounded-2xl border border-[var(--line)] bg-[var(--tint)] p-5 text-center">
          <p className="text-lg font-semibold text-[var(--ink)]">Série terminée !</p>
          <p className="mono mt-1 text-3xl font-bold text-[var(--ink)]">
            {correctCount} / {queue.length}
          </p>
          <div className="mx-auto mt-3 max-w-xs">
            <ProgressBar rate={correctCount / queue.length} />
          </div>

          {missed.length > 0 ? (
            <div className="mt-4">
              <p className="eyebrow">À revoir</p>
              <p className="mt-2 flex flex-wrap justify-center gap-2">
                {missed.map((entry) => (
                  <span key={entry.kana} className="rounded-lg bg-[var(--paper)] px-2.5 py-1 text-sm">
                    <span lang="ja" className="text-lg font-bold">{entry.kana}</span>{" "}
                    <span className="text-[var(--accent-dark)]">{entry.romaji}</span>
                  </span>
                ))}
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {missed.length > 0 ? (
              <button type="button" onClick={() => start(missed)} className="primary-button">
                Revoir mes {missed.length} erreur{missed.length > 1 ? "s" : ""}
              </button>
            ) : null}
            <button type="button" onClick={() => start(pool)} className="secondary-button">
              Recommencer
            </button>
          </div>
        </div>
      ) : current ? (
        <div>
          <div className="mb-3 flex items-baseline justify-between text-xs text-[var(--muted)]">
            <span>
              {position + 1} / {queue.length}
            </span>
            <span className="mono">{correctCount} bonne{correctCount > 1 ? "s" : ""} réponse{correctCount > 1 ? "s" : ""}</span>
          </div>
          <div className="mb-4">
            <ProgressBar rate={position / queue.length} />
          </div>

          <div
            key={current.kana + position}
            className="fade-in-up rounded-2xl border border-[var(--line)] bg-[var(--tint)] py-8 text-center"
          >
            <span className="text-7xl font-bold text-[var(--ink)]" lang="ja">
              {current.kana}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-3">
            <input
              ref={inputRef}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              readOnly={lastResult !== null}
              placeholder="romaji (ex. ka)"
              aria-label="Prononciation en romaji"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="min-h-11 min-w-0 flex-1 border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-lg text-[var(--ink)] outline-none"
            />
            <button type="submit" disabled={!lastResult && !answer.trim()} className="primary-button">
              {lastResult ? "Suivant →" : "Vérifier"}
            </button>
          </form>

          {lastResult ? (
            <p
              role="status"
              className={`fade-in-up mt-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
                lastResult.correct
                  ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success-dark)]"
                  : "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
              }`}
            >
              {lastResult.correct ? "✓ Bonne réponse : " : "✗ C'était : "}
              <span lang="ja">{lastResult.entry.kana}</span> = {lastResult.entry.romaji}
              <span className="ml-2 font-normal opacity-80">
                (<span lang="ja">{lastResult.entry.counterpart}</span> dans l&apos;autre écriture)
              </span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-[var(--muted)]">
              <span className="kbd">Entrée</span> pour vérifier, puis encore pour passer au suivant.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
