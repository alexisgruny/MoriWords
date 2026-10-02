"use client";

import { type FormEvent, useState } from "react";

import { KanaInput } from "@/components/games/kana-input";
import { SpeakButton } from "@/components/speak-button";
import type { LessonWriteQuestion } from "@/lib/course/lessons";
import { isWrittenAnswerCorrect } from "@/lib/course/writing-check";

// Exercice écrit d'une leçon : la phrase française, à écrire en japonais.
// Le romaji tapé devient des kana ; le clavier japonais (kanji) marche aussi.
// Corrigé dans le navigateur, sans Claude.
export function LessonWriting({ questions, onAnswered }: { questions: LessonWriteQuestion[]; onAnswered: (correct: boolean) => void }) {
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<boolean | null>(null);

  const question = questions[position];
  const expected = question.answers[0];
  const kanaVersion = question.answers.find((answer) => answer !== expected);

  function check(event: FormEvent) {
    event.preventDefault();
    if (result !== null || !input.trim()) {
      return;
    }
    const correct = isWrittenAnswerCorrect(input, question.answers);
    setResult(correct);
    onAnswered(correct);
  }

  function next() {
    setResult(null);
    setInput("");
    setPosition((position + 1) % questions.length);
  }

  return (
    <div className="panel">
      <p className="mb-1 text-xs text-[var(--muted)]">
        Phrase {position + 1} / {questions.length}
      </p>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--tint)] p-4">
        <p className="eyebrow">Écris en japonais</p>
        <p className="mt-1 text-xl font-semibold text-[var(--ink)]">{question.fr}</p>
      </div>

      <form onSubmit={check} className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <KanaInput value={input} onChange={setInput} label="Ta phrase en japonais" maxLength={60} />
          <button type="submit" disabled={result !== null || !input.trim()} className="primary-button shrink-0">
            Vérifier
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">Tape en romaji (« watashi » devient わたし) ou avec le clavier japonais.</p>
      </form>

      {result !== null ? (
        <div
          className={`fade-in-up mt-4 rounded-2xl border p-4 ${
            result ? "border-[var(--success)] bg-[var(--success-soft)]" : "border-[var(--accent)] bg-[var(--accent-soft)]"
          }`}
          role="status"
        >
          <p className="font-bold text-[var(--ink)]">{result ? "Bonne réponse !" : "Pas tout à fait. La réponse attendue :"}</p>
          <p className="mt-1 flex items-center gap-2 text-lg text-[var(--ink)]" lang="ja">
            {expected}
            <SpeakButton text={kanaVersion ?? expected} label="Écouter la réponse" size="sm" />
          </p>
          {kanaVersion ? (
            <p className="text-sm text-[var(--muted)]" lang="ja">
              {kanaVersion}
            </p>
          ) : null}
          <button type="button" onClick={next} className="primary-button mt-3">
            Phrase suivante →
          </button>
        </div>
      ) : null}
    </div>
  );
}
