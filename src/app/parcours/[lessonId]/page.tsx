import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonView } from "@/components/lesson-view";
import { findCourse } from "@/lib/course/courses";
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

// Une leçon du parcours débutant (adresse historique /parcours/<leçon>).
export default async function LessonPage({ params }: PageProps<"/parcours/[lessonId]">) {
  const lesson = findLesson((await params).lessonId);
  const course = findCourse("debutant");
  if (!lesson || !course) {
    notFound();
  }
  return <LessonView lesson={lesson} course={course} />;
}
