import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CourseOverview } from "@/components/course-overview";
import { type Course, COURSES, findCourse } from "@/lib/course/courses";

// Le parcours débutant garde son adresse /parcours.
export function generateStaticParams() {
  return COURSES.filter((course) => course.id !== "debutant").map((course) => ({
    courseId: course.id,
  }));
}

export async function generateMetadata({ params }: PageProps<"/lecons/[courseId]">): Promise<Metadata> {
  const course = findCourse((await params).courseId);
  return course ? { title: `${course.title} · MoriWords`, description: course.summary } : { title: "Leçons · MoriWords" };
}

export default async function CoursePage({ params }: PageProps<"/lecons/[courseId]">) {
  const course = findCourse((await params).courseId);
  if (!course) {
    notFound();
  }
  if (course.id === "debutant") {
    redirect(course.basePath);
  }

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <header className="fade-in-up">
          <p className="text-sm">
            <Link href="/lecons" className="link-button text-sm!">
              ← Leçons par niveau
            </Link>
          </p>
          <p className="eyebrow mt-3">
            {course.level} · {course.lessons.length} leçons
          </p>
          <h1 className="mt-1 text-2xl! text-[var(--ink)] sm:text-[2.1rem]!">{course.title}</h1>
          <p className="mt-2 text-[var(--muted)]">{course.summary}</p>
        </header>
        {course.goal ? <CourseProgram course={course} /> : null}
        <CourseOverview
          basePath={course.basePath}
          parts={course.parts}
          lessons={course.lessons.map(({ id, number, title, minutes, summary, kanji }) => ({
            id,
            number,
            title,
            minutes,
            summary,
            kanji: kanji ?? [],
          }))}
        />
      </div>
    </main>
  );
}

// Le programme en un coup d’œil : objectif, contenu, et l’étape d’après.
function CourseProgram({ course }: { course: Course }) {
  const kanjiCount = new Set(course.lessons.flatMap((lesson) => lesson.kanji ?? [])).size;
  const wordCount = new Set(course.lessons.flatMap((lesson) => (lesson.vocabulary ?? []).map((word) => word.ja))).size;
  const stats = [
    { value: course.lessons.length, label: "leçons" },
    { value: kanjiCount, label: "kanji" },
    { value: wordCount, label: "mots clés" },
  ];
  return (
    <section className="panel fade-in-up" aria-label="Programme du cours">
      <p className="font-semibold text-[var(--ink)]">🎯 {course.goal}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse rounded-2xl bg-[var(--tint)] px-2 py-3">
            <dt className="text-xs text-[var(--muted)]">{stat.label}</dt>
            <dd className="text-2xl font-bold text-[var(--ink)]">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Chaque leçon : la règle en encadré, des exemples où la partie importante est en couleur, les pièges à éviter, ses kanji à tracer, puis un QCM et des
        phrases à écrire en japonais. À la fin,{" "}
        <Link href="/paliers" className="link-button text-sm!">
          l’examen blanc {course.examLevel}
        </Link>{" "}
        vérifie ton niveau.
      </p>
    </section>
  );
}
