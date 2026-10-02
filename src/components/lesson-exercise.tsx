"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { JapaneseText } from "@/components/japanese-text";
import { KanaQuiz } from "@/components/kana-quiz";
import { LessonQuiz } from "@/components/lesson-quiz";
import { LessonWriting } from "@/components/lesson-writing";
import { SpeakButton } from "@/components/speak-button";
import { TranslationExercise } from "@/components/translation-exercise";
import { authClient } from "@/lib/auth/auth-client";
import { forgetCourseStatus } from "@/lib/course/course-status";
import type { Lesson } from "@/lib/course/lessons";

// Exercice d'une leçon du parcours : compte les bonnes réponses et valide la
// leçon à l'objectif (enregistrée pour un compte connecté). Les kana se font
// sans compte ; les autres exercices passent par le serveur, donc la connexion.
// Ce que l'exercice doit savoir du cours : son adresse, et la suite une fois
// la dernière leçon validée (palier, cours suivant).
export type LessonCourseInfo = {
  basePath: string;
  title: string;
  isBeginner: boolean;
  examLevel: string;
  next: { title: string; href: string } | null;
};

export function LessonExercise({
  lesson,
  nextLesson,
  course,
}: {
  lesson: Lesson;
  nextLesson: { id: string; title: string } | null;
  course: LessonCourseInfo;
}) {
  const { data: session, isPending } = authClient.useSession();
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const savedRef = useRef(false);
  const countRef = useRef(0);
  // Leçons avec exercice écrit : QCM d'abord, puis l'écrit (étape 2).
  const [step, setStep] = useState<"main" | "writing">("main");
  const [writingCount, setWritingCount] = useState(0);
  const writingCountRef = useRef(0);
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
    if (countRef.current === lesson.goal) {
      if (lesson.writing) {
        setStep("writing");
      } else {
        complete();
      }
    }
  }

  function handleWritten(correct: boolean) {
    if (!correct || !lesson.writing) {
      return;
    }
    writingCountRef.current += 1;
    setWritingCount(writingCountRef.current);
    if (writingCountRef.current === lesson.writing.goal) {
      complete();
    }
  }

  // Objectif et score de l'étape en cours.
  const isWritingStep = step === "writing" && lesson.writing !== undefined;
  const stepGoal = isWritingStep && lesson.writing ? lesson.writing.goal : lesson.goal;
  const stepCount = isWritingStep ? writingCount : correctCount;

  // Kana, QCM de leçon et lecture se corrigent dans le navigateur : sans compte.
  const needsAccount = exercise.kind !== "kana" && exercise.kind !== "reading" && exercise.kind !== "lesson-qcm";

  return (
    <section className="flex flex-col gap-4" aria-labelledby="lesson-exercise-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="lesson-exercise-title" className="text-[var(--ink)]">
          À toi de jouer
        </h2>
        {stepGoal > 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {lesson.writing ? (
              <span className="mr-2 font-semibold text-[var(--accent-dark)]">
                Étape {isWritingStep ? 2 : 1} / 2 · {isWritingStep ? "écrire" : "QCM"}
              </span>
            ) : null}
            <strong className="text-[var(--ink)]">{Math.min(stepCount, stepGoal)}</strong> / {stepGoal} bonnes réponses
            {lesson.writing && !isWritingStep ? " pour passer à l'écrit" : " pour valider"}
          </p>
        ) : null}
      </div>
      {stepGoal > 0 ? (
        <div className="h-2 overflow-hidden rounded-full bg-[var(--tint)]" aria-hidden="true">
          <div className="h-full rounded-full bg-[var(--success)] transition-all" style={{ width: `${Math.min(100, (stepCount / stepGoal) * 100)}%` }} />
        </div>
      ) : null}

      {isCompleted ? (
        <div className="fade-in-up rounded-2xl border border-[var(--success)] bg-[var(--success-soft)] p-4" role="status">
          <p className="font-bold text-[var(--ink)]">{nextLesson ? "Leçon validée ✓" : `🎉 ${course.title} terminé !`}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isLoggedIn ? "Elle est cochée dans ton parcours." : "Crée un compte pour garder ta progression d'une fois sur l'autre."}
          </p>
          {nextLesson ? (
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href={`${course.basePath}/${nextLesson.id}`} className="primary-button">
                Leçon suivante →
              </Link>
              <Link href={course.basePath} className="secondary-button">
                Retour au cours
              </Link>
            </div>
          ) : (
            // Fin du parcours : les trois suites naturelles, de la plus utile à
            // la plus ludique.
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-sm text-[var(--ink)]">Et maintenant ?</p>
              {course.next ? (
                <Link href={course.next.href} className="primary-button text-center">
                  Continuer : {course.next.title} →
                </Link>
              ) : (
                <Link href="/" className="primary-button text-center">
                  Analyser une vraie réplique d&apos;anime →
                </Link>
              )}
              <Link href="/paliers" className="secondary-button text-center">
                🏅 Passer le palier {course.examLevel} (examen blanc)
              </Link>
              <Link href="/jeux" className="secondary-button text-center">
                🎮 Réviser en jouant
              </Link>
            </div>
          )}
        </div>
      ) : null}

      {isWritingStep && lesson.writing ? (
        <LessonWriting questions={lesson.writing.questions} onAnswered={handleWritten} />
      ) : needsAccount && !isPending && !isLoggedIn ? (
        <div className="panel text-center">
          <p className="text-[var(--ink)]">Les exercices de cette leçon demandent un compte (gratuit).</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Link href={`/inscription?suivant=${encodeURIComponent(`${course.basePath}/${lesson.id}`)}`} className="primary-button">
              Créer mon compte
            </Link>
            <Link href={`/connexion?suivant=${encodeURIComponent(`${course.basePath}/${lesson.id}`)}`} className="secondary-button">
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
          {/* Avec des questions de compréhension, la traduction attend la
              fin : sinon elle donnerait les réponses. */}
          {!exercise.questions || isCompleted ? (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-semibold text-[var(--muted)] hover:text-[var(--ink)]">Voir la traduction</summary>
              <p className="mt-2 text-[var(--ink)]">{exercise.translation}</p>
            </details>
          ) : null}
          {exercise.questions || isCompleted ? null : (
            <button type="button" onClick={complete} className="primary-button mt-4">
              J&apos;ai lu et compris le texte ✓
            </button>
          )}
          {/* Questions de compréhension : lire ne suffit plus, il faut avoir compris. */}
          {exercise.questions ? (
            <div className="mt-5">
              <LessonQuiz questions={exercise.questions} onAnswered={handleAnswered} prompt="Question sur le texte" choicesLang="fr" />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
