import { describe, expect, it } from "vitest";

import { WORD_LEVELS } from "@/lib/difficulty/classify";
import { grammarPoints } from "@/lib/grammar/points";
import { INDEXABLE_PATHS } from "@/lib/site";
import { findUnknownWords } from "@/lib/spellcheck/check-french";
import { ALL_LESSON_IDS, COURSES } from "./courses";
import { romajiOf } from "./lessons";
import { N4_LESSONS } from "./n4-lessons";

describe("cours par niveau", () => {
  it("has unique lesson ids across courses and lessons numbered from 1", () => {
    const ids = COURSES.flatMap((course) => course.lessons.map((lesson) => lesson.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ALL_LESSON_IDS.size).toBe(ids.length);
    for (const course of COURSES) {
      expect(course.lessons.map((lesson) => lesson.number)).toEqual(course.lessons.map((_, index) => index + 1));
    }
  });

  it("lists every course and lesson in the sitemap", () => {
    for (const course of COURSES) {
      expect(INDEXABLE_PATHS).toContain(course.basePath);
      course.lessons.forEach((lesson) => expect(INDEXABLE_PATHS).toContain(`${course.basePath}/${lesson.id}`));
    }
  });
});

describe("cours N4", () => {
  it("teaches N4 (or N5) vocabulary only", () => {
    const words = N4_LESSONS.flatMap((lesson) => lesson.vocabulary ?? []);
    const offLevel = words.filter((word) => !["N4", "N5"].includes(WORD_LEVELS[word.ja] ?? WORD_LEVELS[word.reading ?? ""] ?? ""));
    expect(offLevel.map((word) => word.ja)).toEqual([]);
    expect(words.length).toBeGreaterThan(20);
  });

  it("has well-formed QCMs: a reachable goal, the answer never among the traps", () => {
    for (const lesson of N4_LESSONS) {
      const questions = lesson.exercise.kind === "lesson-qcm" || lesson.exercise.kind === "reading" ? (lesson.exercise.questions ?? []) : [];
      expect(questions.length, lesson.id).toBeGreaterThanOrEqual(lesson.goal);
      for (const question of questions) {
        expect(question.wrong, question.fr).not.toContain(question.answer);
        expect(new Set(question.wrong).size, question.fr).toBe(question.wrong.length);
      }
    }
  });

  it("gives hand-written romaji for every example sentence", () => {
    const examples = N4_LESSONS.flatMap((lesson) => lesson.sections.flatMap((section) => section.examples ?? []));
    expect(examples.filter((example) => !example.romaji).map((example) => example.ja)).toEqual([]);
    const entries = [...examples, ...N4_LESSONS.flatMap((lesson) => lesson.vocabulary ?? [])];
    expect(entries.filter((entry) => /[\u3040-\u30ff\u4e00-\u9faf]/.test(romajiOf(entry))).map((entry) => entry.ja)).toEqual([]);
  });

  it("links to grammar points that exist", () => {
    const ids = new Set(grammarPoints.map((point) => point.id));
    for (const lesson of N4_LESSONS) {
      const point = lesson.morePractice?.href.match(/point=([\w-]+)/)?.[1];
      if (point) expect(ids, lesson.id).toContain(point);
    }
  });

  it("is written in correct French", () => {
    const texts = N4_LESSONS.flatMap((lesson) => [
      lesson.title,
      lesson.summary,
      ...(lesson.keyPoints ?? []),
      ...lesson.sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.examples ?? []).map((example) => example.fr)]),
      ...(lesson.vocabulary ?? []).map((word) => word.fr),
      ...(lesson.exercise.kind === "lesson-qcm" ? lesson.exercise.questions.map((question) => question.fr) : []),
      ...(lesson.exercise.kind === "reading"
        ? [lesson.exercise.translation, ...(lesson.exercise.questions ?? []).flatMap((question) => [question.fr, question.answer, ...question.wrong])]
        : []),
    ]);
    const unknown = texts
      .flatMap((text) => findUnknownWords(text))
      .filter((word) => !(word.includes("-") && word.split("-").every((part) => findUnknownWords(part).length === 0)));
    expect(unknown).toEqual([]);
  });
});
