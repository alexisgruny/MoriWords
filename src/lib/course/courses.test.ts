import { describe, expect, it } from "vitest";

import { WORD_LEVELS } from "@/lib/difficulty/classify";
import { grammarPoints } from "@/lib/grammar/points";
import { INDEXABLE_PATHS } from "@/lib/site";
import { findUnknownWords } from "@/lib/spellcheck/check-french";
import { ALL_LESSON_IDS, COURSES } from "./courses";
import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { romajiOf, stripMarks } from "./lessons";
import { N4_LESSONS } from "./n4-lessons";
import { N5_LESSONS } from "./n5-lessons";

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

describe("cours N5 (format enrichi)", () => {
  const allTexts = (lesson: (typeof N5_LESSONS)[number]) => [
    lesson.title,
    lesson.summary,
    ...(lesson.keyPoints ?? []),
    ...lesson.sections.flatMap((section) => [
      section.title,
      section.formula ?? "",
      section.tip ?? "",
      ...section.paragraphs,
      ...(section.examples ?? []).flatMap((example) => [example.ja, example.reading ?? "", example.romaji ?? "", example.fr]),
    ]),
  ];

  it("teaches N5 vocabulary and N5 kanji", () => {
    const words = N5_LESSONS.flatMap((lesson) => lesson.vocabulary ?? []);
    const offLevel = words.filter((word) => (WORD_LEVELS[word.ja] ?? WORD_LEVELS[word.reading ?? ""]) !== "N5");
    expect(offLevel.map((word) => word.ja)).toEqual([]);
    const kanji = N5_LESSONS.flatMap((lesson) => lesson.kanji ?? []);
    expect(kanji.filter((char) => JLPT_KANJI.find((entry) => entry.kanji === char)?.level !== "N5")).toEqual([]);
    expect(new Set(kanji).size).toBe(kanji.length);
  });

  it("closes every colour mark and keeps marks out of the French translations", () => {
    for (const lesson of N5_LESSONS) {
      for (const text of allTexts(lesson)) {
        expect(stripMarks(text), text).not.toMatch(/[[\]]|\*\*/);
      }
      for (const example of lesson.sections.flatMap((section) => section.examples ?? [])) {
        expect(example.fr, example.fr).not.toMatch(/[[\]]/);
        // Même partie en couleur dans le japonais, la lecture et le romaji.
        const count = (text: string | undefined) => (text?.match(/\[/g) ?? []).length;
        expect(count(example.reading), example.ja).toBe(count(example.ja));
        expect(count(example.romaji), example.ja).toBe(count(example.ja));
      }
    }
  });

  it("has complete romaji and a QCM plus a writing step for each grammar lesson", () => {
    const entries = N5_LESSONS.flatMap((lesson) => [...lesson.sections.flatMap((section) => section.examples ?? []), ...(lesson.vocabulary ?? [])]);
    expect(entries.filter((entry) => /[\u3040-\u30ff\u4e00-\u9faf]/.test(stripMarks(romajiOf(entry)))).map((entry) => entry.ja)).toEqual([]);
    for (const lesson of N5_LESSONS.filter((candidate) => candidate.exercise.kind === "lesson-qcm")) {
      expect(lesson.writing, lesson.id).toBeDefined();
      const writing = lesson.writing!;
      expect(writing.questions.length, lesson.id).toBeGreaterThanOrEqual(writing.goal);
      for (const question of writing.questions) {
        // Au moins une réponse tapable au clavier sans kanji.
        expect(question.answers.some((answer) => !/[\u4e00-\u9faf]/.test(answer)), question.fr).toBe(true);
      }
      if (lesson.exercise.kind === "lesson-qcm") {
        for (const question of lesson.exercise.questions) expect(question.wrong, question.fr).not.toContain(question.answer);
      }
    }
  });

  it("is written in correct French", () => {
    const texts = N5_LESSONS.flatMap((lesson) => [
      // Textes en fran\u00e7ais seulement (ni le romaji ni le japonais des exemples).
      lesson.title,
      lesson.summary,
      ...(lesson.keyPoints ?? []),
      ...lesson.sections.flatMap((section) => [section.title, section.formula ?? "", section.tip ?? "", ...section.paragraphs]),
      ...lesson.sections.flatMap((section) => (section.examples ?? []).map((example) => example.fr)),
      ...(lesson.vocabulary ?? []).map((word) => word.fr),
      ...(lesson.exercise.kind === "lesson-qcm" ? lesson.exercise.questions.map((question) => question.fr) : []),
      ...(lesson.writing?.questions ?? []).map((question) => question.fr),
      ...(lesson.exercise.kind === "reading"
        ? [lesson.exercise.translation, ...(lesson.exercise.questions ?? []).flatMap((question) => [question.fr, question.answer, ...question.wrong])]
        : []),
    ]);
    const unknown = texts
      .map(stripMarks)
      .flatMap((text) => findUnknownWords(text))
      .filter((word) => !(word.includes("-") && word.split("-").every((part) => findUnknownWords(part).length === 0)));
    expect(unknown).toEqual([]);
  });
});
