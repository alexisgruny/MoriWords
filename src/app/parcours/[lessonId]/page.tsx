import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonExercise } from "@/components/lesson-exercise";
import { SpeakButton } from "@/components/speak-button";
import { LESSONS, findLesson } from "@/lib/course/lessons";

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
                      <p className="text-sm text-[var(--muted)]">{example.fr}</p>
                    </div>
                    <SpeakButton text={example.reading ?? example.ja} label="Écouter l'exemple" size="sm" />
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <LessonExercise lesson={lesson} nextLesson={next ? { id: next.id, title: next.title } : null} />
      </div>
    </main>
  );
}
