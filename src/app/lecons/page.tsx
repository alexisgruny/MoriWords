import type { Metadata } from "next";
import Link from "next/link";

import { COURSES } from "@/lib/course/courses";

export const metadata: Metadata = {
  title: "Leçons par niveau · MoriWords",
  description: "Des cours de japonais en français, du débutant au N4 : grammaire, vocabulaire et exercices corrigés.",
};

// Onglet « Leçons » : les cours du plus facile au plus avancé.
export default function CoursesPage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="fade-in-up">
          <p className="eyebrow mb-1">Apprendre</p>
          <h1 className="text-[var(--ink)]">Leçons par niveau</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Des cours courts en français, de plus en plus avancés : à chaque leçon, une règle de grammaire expliquée,
            du vocabulaire, des exemples à écouter et un exercice pour la valider. Lisibles sans compte.
          </p>
        </header>

        <ol className="flex flex-col gap-3">
          {COURSES.map((course, index) => (
            <li key={course.id}>
              <Link href={course.basePath} className="panel flex items-start gap-4 transition hover:border-[var(--ink)]">
                <span className="step-number shrink-0" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-semibold text-[var(--accent)]">
                    {course.level} · {course.lessons.length} leçons
                  </span>
                  <span className="text-lg font-bold text-[var(--ink)]">{course.title}</span>
                  <span className="mt-1 text-sm text-[var(--muted)]">{course.summary}</span>
                </span>
              </Link>
            </li>
          ))}
          <li className="panel flex items-start gap-4 opacity-70">
            <span className="step-number shrink-0" aria-hidden="true">
              {COURSES.length + 1}
            </span>
            <span className="flex flex-col">
              <span className="text-xs font-semibold text-[var(--muted)]">N3 · bientôt</span>
              <span className="text-lg font-bold text-[var(--ink)]">Cours N3</span>
              <span className="mt-1 text-sm text-[var(--muted)]">
                En préparation. En attendant, la grammaire N3 est déjà sur la page Grammaire.
              </span>
            </span>
          </li>
        </ol>
      </div>
    </main>
  );
}
