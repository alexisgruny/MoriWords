"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readApiError } from "@/lib/api-error";
import type { LevelStatus } from "@/lib/exams/attempts";
import { CATEGORY_LABELS, type CategoryResult, type ExamCategory, type ExamQuestion } from "@/lib/exams/types";
import type { GrammarLevel } from "@/lib/grammar/points";

type Running = { level: GrammarLevel; attemptId: string; questions: ExamQuestion[] };
type Result = {
  level: GrammarLevel;
  questions: ExamQuestion[];
  given: number[];
  answers: number[];
  score: number;
  total: number;
  passed: boolean;
  byCategory: Partial<Record<ExamCategory, CategoryResult>>;
};

// Où retravailler chaque catégorie après l'examen.
const PRACTICE_LINKS: Record<ExamCategory, { href: string; label: string }> = {
  "kanji-sens": { href: "/kanji", label: "Revoir les kanji" },
  "kanji-lecture": { href: "/kanji", label: "Revoir les kanji" },
  vocabulaire: { href: "/jeux/memory", label: "Jouer au memory" },
  grammaire: { href: "/grammaire", label: "Revoir la grammaire" },
  conjugaison: { href: "/conjugaison", label: "Revoir la conjugaison" },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" });

// Paliers MoriWords : un examen blanc par niveau (40 questions, 75 % pour
// réussir). Ce n'est pas le JLPT officiel, juste un repère pour progresser.
export default function LevelsPage() {
  const [statuses, setStatuses] = useState<LevelStatus[] | null>(null);
  const [running, setRunning] = useState<Running | null>(null);
  const [position, setPosition] = useState(0);
  const [given, setGiven] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  // Incrémenté après un examen rendu pour recharger les badges.
  const [statusVersion, setStatusVersion] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    void (async () => {
      const response = await fetch("/api/exams");
      if (isCancelled) return;
      if (!response.ok) {
        setError(await readApiError(response, "Impossible de charger tes paliers."));
        return;
      }
      const data = (await response.json()) as { levels: LevelStatus[] };
      if (!isCancelled) setStatuses(data.levels);
    })();
    return () => {
      isCancelled = true;
    };
  }, [statusVersion]);

  async function start(level: GrammarLevel) {
    setIsBusy(true);
    setError("");
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Impossible de lancer l'examen."));
        return;
      }
      const data = (await response.json()) as { attemptId: string; questions: ExamQuestion[] };
      setRunning({ level, ...data });
      setGiven(data.questions.map(() => -1));
      setPosition(0);
      setResult(null);
      window.scrollTo({ top: 0 });
    } finally {
      setIsBusy(false);
    }
  }

  async function submit() {
    if (!running) return;
    setIsBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/exams/${running.attemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: given }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Impossible de corriger l'examen."));
        return;
      }
      const data = (await response.json()) as Omit<Result, "level" | "questions" | "given">;
      setResult({ ...data, level: running.level, questions: running.questions, given });
      setRunning(null);
      window.scrollTo({ top: 0 });
      setStatusVersion((version) => version + 1);
    } finally {
      setIsBusy(false);
    }
  }

  function choose(choice: number) {
    if (!running) return;
    setGiven(given.map((value, index) => (index === position ? choice : value)));
    if (position + 1 < running.questions.length) {
      setPosition(position + 1);
    }
  }

  const errorBox = error ? (
    <p className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--ink)]" role="alert">
      {error}
    </p>
  ) : null;

  if (running) {
    const question = running.questions[position];
    const answeredCount = given.filter((value) => value !== -1).length;
    const isLast = position + 1 === running.questions.length;
    return (
      <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <div className="flex items-center justify-between text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">Palier {running.level}</span>
            <span>
              Question {position + 1} / {running.questions.length} · {answeredCount} répondue{answeredCount > 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
            <div className="h-full bg-[var(--accent)]" style={{ width: `${(answeredCount / running.questions.length) * 100}%` }} />
          </div>

          <div className="panel">
            <p className="eyebrow">{CATEGORY_LABELS[question.category]}</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{question.prompt}</p>
            {question.subject ? (
              <p className="mt-3 text-center text-5xl font-semibold text-[var(--ink)]" lang="ja">
                {question.subject}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            {question.choices.map((choice, index) => (
              <button
                key={choice}
                type="button"
                onClick={() => choose(index)}
                lang={question.choicesLang}
                className={`min-h-12 cursor-pointer rounded-xl border px-4 py-2.5 text-left text-[var(--ink)] ${
                  question.choicesLang === "ja" ? "text-lg" : ""
                } ${
                  given[position] === index
                    ? "border-[var(--ink)] bg-[var(--tint)] font-semibold"
                    : "border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--ink)]"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPosition(Math.max(0, position - 1))}
              disabled={position === 0}
              className="secondary-button disabled:opacity-40"
            >
              ← Précédente
            </button>
            {!isLast ? (
              <button type="button" onClick={() => setPosition(position + 1)} className="link-button text-sm!">
                Passer
              </button>
            ) : null}
            {isLast || answeredCount === running.questions.length ? (
              <button type="button" onClick={() => void submit()} disabled={isBusy} className="primary-button ml-auto">
                {isBusy ? "Correction…" : "Rendre ma copie"}
              </button>
            ) : null}
          </div>
          {answeredCount < running.questions.length && isLast ? (
            <p className="text-sm text-[var(--muted)]">
              {running.questions.length - answeredCount} question(s) sans réponse : elles compteront comme fausses.
            </p>
          ) : null}
          {errorBox}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="fade-in-up">
          <p className="eyebrow mb-1">Suivi</p>
          <h1 className="text-[var(--ink)]">Paliers MoriWords</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Un examen blanc par niveau : 40 questions à choix (kanji, vocabulaire, grammaire, conjugaison), réussi à partir
            de 75 %. Chaque examen est tiré au hasard. Si tu le rates, tu pourras le repasser 24 h plus tard. C&apos;est un
            repère pour progresser, pas le JLPT officiel ni un certificat.
          </p>
        </header>

        {errorBox}

        {result ? <ExamResult result={result} onClose={() => setResult(null)} /> : null}

        {statuses === null ? (
          <p className="text-sm text-[var(--muted)]">Chargement…</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {statuses.map((status) => (
              <li
                key={status.level}
                className={`panel flex flex-col gap-2 ${status.passed ? "border-[var(--success)]! bg-[var(--success-soft)]!" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-[var(--ink)]">Palier {status.level}</h2>
                  {status.passed ? (
                    <span className="rounded-full bg-[var(--success)] px-3 py-1 text-xs font-bold text-white">🏅 Réussi</span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {status.bestScore === null
                    ? "Pas encore tenté."
                    : `Meilleur score : ${status.bestScore} / ${status.total}`}
                </p>
                {status.retryAt ? (
                  <p className="text-sm text-[var(--muted)]">Tu pourras le repasser {formatDate(status.retryAt)}.</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void start(status.level)}
                    disabled={isBusy}
                    className={`${status.passed ? "secondary-button" : "primary-button"} self-start`}
                  >
                    {status.inProgress ? "Reprendre l'examen" : status.passed ? "Repasser" : "Passer l'examen"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function ExamResult({ result, onClose }: { result: Result; onClose: () => void }) {
  const percent = Math.round((result.score / result.total) * 100);
  const mistakes = result.questions
    .map((question, index) => ({ question, given: result.given[index], answer: result.answers[index] }))
    .filter((item) => item.given !== item.answer);
  const categories = Object.entries(result.byCategory) as [ExamCategory, CategoryResult][];

  return (
    <section className="fade-in-up panel flex flex-col gap-4" role="status" aria-labelledby="exam-result-title">
      <div>
        <h2 id="exam-result-title" className="text-xl font-bold text-[var(--ink)]">
          {result.passed ? `🏅 Palier ${result.level} réussi !` : `Palier ${result.level} pas encore validé`}
        </h2>
        <p className="mt-1 text-[var(--ink)]">
          {result.score} / {result.total} ({percent} %).{" "}
          {result.passed ? "Bravo, ton badge est sur cette page." : "Il faut 75 % : regarde tes points faibles ci-dessous."}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {categories.map(([category, stats]) => {
          const rate = stats.correct / stats.total;
          return (
            <li key={category} className="text-sm">
              <div className="flex items-center justify-between gap-2 text-[var(--ink)]">
                <span className="font-semibold">{CATEGORY_LABELS[category]}</span>
                <span>
                  {stats.correct} / {stats.total}
                  {rate < 0.75 ? (
                    <Link href={PRACTICE_LINKS[category].href} className="link-button ml-2 text-sm!">
                      {PRACTICE_LINKS[category].label}
                    </Link>
                  ) : null}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className={`h-full ${rate >= 0.75 ? "bg-[var(--success)]" : "bg-[var(--accent)]"}`}
                  style={{ width: `${rate * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {mistakes.length > 0 ? (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">
            Voir mes {mistakes.length} erreur{mistakes.length > 1 ? "s" : ""}
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {mistakes.map(({ question, given, answer }, index) => (
              <li key={index} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                <p className="text-[var(--muted)]">
                  {question.prompt} {question.subject ? <span lang="ja">{question.subject}</span> : null}
                </p>
                <p className="text-[var(--ink)]" lang={question.choicesLang}>
                  ✓ {question.choices[answer]}
                </p>
                <p className="text-[var(--accent)]" lang={question.choicesLang}>
                  ✗ {given === -1 ? "Pas de réponse" : question.choices[given]}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <button type="button" onClick={onClose} className="secondary-button self-start">
        Fermer
      </button>
    </section>
  );
}
