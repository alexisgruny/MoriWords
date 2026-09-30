import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonExercise } from "@/components/lesson-exercise";
import { LessonKanaTable } from "@/components/lesson-kana-table";
import { SpeakButton } from "@/components/speak-button";
import { LESSONS, findLesson, romajiOf } from "@/lib/course/lessons";

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ lessonId: lesson.id }));
}

export async function generateMetadata({ params }: PageProps<"/parcours/[lessonId]">): Promise<Metadata> {
  const lesson = findLesson((await params).lessonId);
  return lesson
    ? { title: `${lesson.title} · Parcours débutant MoriWords`, description: lesson.summary }
    : { title: "Parcours débutant · MoriWords" };
}

// Une leçon du parcours : explications et exemples (lisibles sans compte),
// puis l'exercice qui la valide.
export default async function LessonPage({ params }: PageProps<"/parcours/[lessonId]">) {
  const lesson = findLesson((await params).lessonId);
  if (!lesson) {
    notFound();
  }
  const next = LESSONS.find((candidate) => candidate.number === lesson.number + 1);
  const showRomaji = lesson.exercise.kind !== "kana";

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="fade-in-up">
          <p className="text-sm">
            <Link href="/parcours" className="link-button text-sm!">
              ← Parcours débutant
            </Link>
          </p>
          <p className="eyebrow mt-3">
            Leçon {lesson.number} / {LESSONS.length} · {lesson.minutes} min
          </p>
          <h1 className="mt-1 text-2xl! text-[var(--ink)] sm:text-[2.1rem]!">{lesson.title}</h1>
          <p className="mt-2 text-[var(--muted)]">{lesson.summary}</p>
          {lesson.exercise.kind === "kana" ? (
            <a href="#lesson-kana-title" className="secondary-button mt-4 inline-flex text-sm!">
              Voir le tableau des kana ↓
            </a>
          ) : null}
        </header>

        {lesson.sections.map((section) => (
          <section key={section.title} className="panel">
            <h2 className="text-lg font-bold text-[var(--ink)]">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-2 leading-7 text-[var(--ink)]">
                {paragraph}
              </p>
            ))}
            {section.examples ? (
              <ul className="mt-4 flex flex-col gap-2">
                {section.examples.map((example) => (
                  <li key={example.ja} className="flex items-center gap-3 border-l-2 border-[var(--accent)] py-1 pl-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg text-[var(--ink)]" lang="ja">
                        {example.ja}
                      </p>
                      {example.reading ? (
                        <p className="text-sm text-[var(--muted)]" lang="ja">
                          {example.reading}
                        </p>
                      ) : null}
                      {/* Leçons de kana : le romaji est déjà dans la traduction. */}
                      {showRomaji ? <p className="text-sm text-[var(--accent-dark)] italic">{romajiOf(example)}</p> : null}
                      <p className="text-sm text-[var(--muted)]">{example.fr}</p>
                    </div>
                    <SpeakButton text={example.reading ?? example.ja} label="Écouter l'exemple" size="sm" />
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {lesson.exercise.kind === "kana" ? (
          <LessonKanaTable script={lesson.exercise.script} groups={lesson.exercise.groups} />
        ) : null}

        {lesson.vocabulary ? (
          <section className="panel" aria-labelledby="lesson-vocabulary-title">
            <h2 id="lesson-vocabulary-title" className="text-lg font-bold text-[var(--ink)]">
              Le vocabulaire de la leçon
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              L&apos;exercice n&apos;utilise que ces mots : lis-les et écoute-les d&apos;abord.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {lesson.vocabulary.map((word) => (
                <li key={word.ja} className="flex items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-[var(--ink)]" lang="ja">
                      {word.ja}
                      {word.reading ? (
                        <span className="ml-2 text-sm font-normal text-[var(--muted)]">{word.reading}</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-[var(--accent-dark)] italic">{romajiOf(word)}</p>
                    <p className="text-sm text-[var(--muted)]">{word.fr}</p>
                  </div>
                  <SpeakButton text={word.reading ?? word.ja} label="Écouter le mot" size="sm" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {lesson.keyPoints ? (
          <section className="panel border-[var(--accent)]!" aria-labelledby="lesson-key-points-title">
            <h2 id="lesson-key-points-title" className="text-lg font-bold text-[var(--ink)]">
              📌 À retenir
            </h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {lesson.keyPoints.map((point) => (
                <li key={point} className="flex gap-2 leading-7 text-[var(--ink)]">
                  <span className="text-[var(--accent)]" aria-hidden="true">
                    •
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <LessonExercise lesson={lesson} nextLesson={next ? { id: next.id, title: next.title } : null} />

        {lesson.morePractice ? (
          <p className="text-center text-sm text-[var(--muted)]">
            Pour aller plus loin :{" "}
            <Link href={lesson.morePractice.href} className="link-button text-sm!">
              {lesson.morePractice.label} →
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
