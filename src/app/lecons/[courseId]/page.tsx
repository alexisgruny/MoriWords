import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CourseOverview } from "@/components/course-overview";
import { COURSES, findCourse } from "@/lib/course/courses";

// Le parcours débutant garde son adresse /parcours.
export function generateStaticParams() {
  return COURSES.filter((course) => course.id !== "debutant").map((course) => ({ courseId: course.id }));
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
        <CourseOverview
          basePath={course.basePath}
          lessons={course.lessons.map(({ id, number, title, minutes, summary }) => ({ id, number, title, minutes, summary }))}
        />
      </div>
    </main>
  );
}
