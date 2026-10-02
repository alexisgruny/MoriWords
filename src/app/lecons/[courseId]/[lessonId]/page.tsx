import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LessonView } from "@/components/lesson-view";
import { COURSES, findCourse } from "@/lib/course/courses";

export function generateStaticParams() {
  return COURSES.filter((course) => course.id !== "debutant").flatMap((course) =>
    course.lessons.map((lesson) => ({ courseId: course.id, lessonId: lesson.id })),
  );
}

export async function generateMetadata({ params }: PageProps<"/lecons/[courseId]/[lessonId]">): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const course = findCourse(courseId);
  const lesson = course?.lessons.find((candidate) => candidate.id === lessonId);
  return course && lesson
    ? { title: `${lesson.title} · ${course.title} MoriWords`, description: lesson.summary }
    : { title: "Leçons · MoriWords" };
}

// Une leçon d'un cours de niveau (N4…).
export default async function CourseLessonPage({ params }: PageProps<"/lecons/[courseId]/[lessonId]">) {
  const { courseId, lessonId } = await params;
  const course = findCourse(courseId);
  const lesson = course?.lessons.find((candidate) => candidate.id === lessonId);
  if (!course || !lesson) {
    notFound();
  }
  if (course.id === "debutant") {
    redirect(`${course.basePath}/${lesson.id}`);
  }
  return <LessonView lesson={lesson} course={course} />;
}
