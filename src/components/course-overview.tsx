"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

type LessonSummary = {
  id: string;
  number: number;
  title: string;
  minutes: number;
  summary: string;
  kanji?: string[];
};
type CoursePart = { title: string; lessonIds: string[] };

// Liste des leçons avec leur état (validée ✓, prochaine à faire) pour un
// compte connecté ; sans compte, la liste simple.
// basePath : adresse du cours (/parcours pour le débutant, /lecons/n4…).
// parts : leçons regroupées sous des titres de partie (cours N5).
export function CourseOverview({ lessons, basePath = "/parcours", parts }: { lessons: LessonSummary[]; basePath?: string; parts?: CoursePart[] }) {
  const { data: session } = authClient.useSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const isLoggedIn = Boolean(session);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    let cancelled = false;
    void fetch("/api/course")
      .then((response) => (response.ok ? (response.json() as Promise<{ completed: string[] }>) : null))
      .then((data) => {
        if (!cancelled && data) {
          setCompleted(new Set(data.completed));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const nextId = lessons.find((lesson) => !completed.has(lesson.id))?.id;
  const doneCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const kanjiTotal = new Set(lessons.flatMap((lesson) => lesson.kanji ?? [])).size;
  const kanjiSeen = new Set(lessons.filter((lesson) => completed.has(lesson.id)).flatMap((lesson) => lesson.kanji ?? [])).size;
  const groups = parts
    ? parts.map((part) => ({
        title: part.title,
        lessons: lessons.filter((lesson) => part.lessonIds.includes(lesson.id)),
      }))
    : [{ title: "", lessons }];

  return (
    <>
      {isLoggedIn ? (
        <div className="panel">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold text-[var(--ink)]">Ta progression</p>
            <p className="text-sm text-[var(--muted)]">
              <strong className="text-[var(--ink)]">{doneCount}</strong> / {lessons.length} leçons
            </p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--tint)]" aria-hidden="true">
            <div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${(doneCount / lessons.length) * 100}%` }} />
          </div>
          {kanjiTotal > 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Kanji appris : <strong className="text-[var(--ink)]">{kanjiSeen}</strong> / {kanjiTotal}
            </p>
          ) : null}
        </div>
      ) : null}

      {groups.map((group, index) => (
        <section key={group.title || "lecons"} className="flex flex-col gap-3" aria-label={group.title || undefined}>
          {group.title ? (
            <h2 className="mt-2 text-lg! text-[var(--ink)]">
              <span className="text-[var(--muted)]">Partie {index + 1} · </span>
              {group.title}
            </h2>
          ) : null}
          <ol className="flex flex-col gap-3">
            {group.lessons.map((lesson) => {
              const isDone = completed.has(lesson.id);
              const isNext = isLoggedIn && lesson.id === nextId;
              return (
                <li key={lesson.id}>
                  <Link
                    href={`${basePath}/${lesson.id}`}
                    className={`token-card mb-0! flex items-center gap-4 transition hover:border-[var(--accent)] ${
                      isNext ? "border-[var(--accent)]! shadow-[0_0_0_1px_var(--accent)]" : ""
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        isDone ? "bg-[var(--success)] text-white" : "bg-[var(--tint)] text-[var(--ink)]"
                      }`}
                      aria-hidden="true"
                    >
                      {isDone ? "✓" : lesson.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[var(--ink)]">{lesson.title}</span>
                      <span className="block text-sm text-[var(--muted)]">{lesson.summary}</span>
                    </span>
                    <span className="shrink-0 text-xs text-[var(--muted)]">{isDone ? "validée" : isNext ? "à faire" : `${lesson.minutes} min`}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </>
  );
}
