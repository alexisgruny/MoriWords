"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { JapaneseText } from "@/components/japanese-text";
import { KanaQuiz } from "@/components/kana-quiz";
import { LessonQuiz } from "@/components/lesson-quiz";
import { SpeakButton } from "@/components/speak-button";
import { TranslationExercise } from "@/components/translation-exercise";
import { authClient } from "@/lib/auth/auth-client";
import { forgetCourseStatus } from "@/lib/course/course-status";
import type { Lesson } from "@/lib/course/lessons";

// Exercice d'une leçon du parcours : compte les bonnes réponses et valide la
// leçon à l'objectif (enregistrée pour un compte connecté). Les kana se font
// sans compte ; les autres exercices passent par le serveur, donc la connexion.
export function LessonExercise({ lesson, nextLesson }: { lesson: Lesson; nextLesson: { id: string; title: string } | null }) {
  const { data: session, isPending } = authClient.useSession();
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const savedRef = useRef(false);
  const countRef = useRef(0);
  const exercise = lesson.exercise;
  const isLoggedIn = Boolean(session);

  // Déjà validée lors d'une visite précédente ?
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    let cancelled = false;
    void fetch("/api/course")
      .then((response) => (response.ok ? (response.json() as Promise<{ completed: string[] }>) : null))
      .then((data) => {
        if (!cancelled && data?.completed.includes(lesson.id)) {
          setIsCompleted(true);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, lesson.id]);

  function complete() {
    setIsCompleted(true);
    if (isLoggedIn && !savedRef.current) {
      savedRef.current = true;
      void fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      })
        // La dernière leçon validée peut retirer le parcours du menu.
        .then(() => forgetCourseStatus())
        .catch(() => undefined);
    }
  }

  function handleAnswered(correct: boolean) {
    if (!correct) {
      return;
    }
    countRef.current += 1;
    setCorrectCount(countRef.current);
    if (countRef.current >= lesson.goal) {
      complete();
    }
  }

  // Kana, QCM de leçon et lecture se corrigent dans le navigateur : sans compte.
  const needsAccount = exercise.kind !== "kana" && exercise.kind !== "reading" && exercise.kind !== "lesson-qcm";

  return (
    <section className="flex flex-col gap-4" aria-labelledby="lesson-exercise-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="lesson-exercise-title" className="text-[var(--ink)]">
          À toi de jouer
        </h2>
        {lesson.goal > 0 ? (
          <p className="text-sm text-[var(--muted)]">
            <strong className="text-[var(--ink)]">{Math.min(correctCount, lesson.goal)}</strong> / {lesson.goal} bonnes
            réponses pour valider
          </p>
        ) : null}
      </div>
      {lesson.goal > 0 ? (
        <div className="h-2 overflow-hidden rounded-full bg-[var(--tint)]" aria-hidden="true">
          <div className="h-full rounded-full bg-[var(--success)] transition-all" style={{ width: `${Math.min(100, (correctCount / lesson.goal) * 100)}%` }} />
        </div>
      ) : null}

      {isCompleted ? (
        <div className="fade-in-up rounded-2xl border border-[var(--success)] bg-[var(--success-soft)] p-4" role="status">
          <p className="font-bold text-[var(--ink)]">Leçon validée ✓</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isLoggedIn ? "Elle est cochée dans ton parcours." : "Crée un compte pour garder ta progression d'une fois sur l'autre."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {nextLesson ? (
              <Link href={`/parcours/${nextLesson.id}`} className="primary-button">
                Leçon suivante →
              </Link>
            ) : (
              <Link href="/" className="primary-button">
                Analyser ma première réplique →
              </Link>
            )}
            <Link href="/parcours" className="secondary-button">
              Retour au parcours
            </Link>
          </div>
        </div>
      ) : null}

      {needsAccount && !isPending && !isLoggedIn ? (
        <div className="panel text-center">
          <p className="text-[var(--ink)]">Les exercices de cette leçon demandent un compte (gratuit).</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Link href={`/inscription?suivant=${encodeURIComponent(`/parcours/${lesson.id}`)}`} className="primary-button">
              Créer mon compte
            </Link>
            <Link href={`/connexion?suivant=${encodeURIComponent(`/parcours/${lesson.id}`)}`} className="secondary-button">
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      ) : exercise.kind === "kana" ? (
        <KanaQuiz format="choice" preset={{ script: exercise.script, groups: exercise.groups }} onAnswered={handleAnswered} />
      ) : exercise.kind === "lesson-qcm" ? (
        <LessonQuiz questions={exercise.questions} onAnswered={handleAnswered} />
      ) : exercise.kind === "grammar" ? (
        <TranslationExercise source="grammar" focusIn={exercise.patterns} defaultFormat="choice" onAnswered={handleAnswered} />
      ) : exercise.kind === "conjugation" ? (
        <TranslationExercise source="conjugation" focusIn={exercise.forms} defaultFormat="choice" onAnswered={handleAnswered} />
      ) : exercise.kind === "kanji" ? (
        <TranslationExercise source="kanji" focusIn={exercise.kanji} defaultFormat="choice" onAnswered={handleAnswered} />
      ) : (
        <div className="panel">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="eyebrow">Touche un mot pour son sens</p>
            <SpeakButton text={exercise.text} label="Écouter le texte" size="sm" />
          </div>
          <p className="text-xl text-[var(--ink)]">
            {isLoggedIn ? <JapaneseText text={exercise.text} interactive /> : <span lang="ja">{exercise.text}</span>}
          </p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-[var(--muted)] hover:text-[var(--ink)]">Voir la traduction</summary>
            <p className="mt-2 text-[var(--ink)]">{exercise.translation}</p>
          </details>
          {isCompleted ? null : (
            <button type="button" onClick={complete} className="primary-button mt-4">
              J&apos;ai lu et compris le texte ✓
            </button>
          )}
        </div>
      )}
    </section>
  );
}
