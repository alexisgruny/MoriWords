import { describe, expect, it } from "vitest";

import { WORD_LEVELS } from "@/lib/difficulty/classify";
import { grammarPoints } from "@/lib/grammar/points";
import { INDEXABLE_PATHS } from "@/lib/site";
import { findUnknownWords } from "@/lib/spellcheck/check-french";
import { ALL_LESSON_IDS, COURSES } from "./courses";
import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { romajiOf, stripMarks } from "./lessons";
import type { Lesson } from "./lessons";
import { N4_LESSONS, N4_PARTS } from "./n4-lessons";
import { N5_LESSONS, N5_PARTS } from "./n5-lessons";

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

// Cours au format enrichi (N5, N4) : mêmes vérifications pour chacun.
const ENRICHED_COURSES = [
  { name: "N5", lessons: N5_LESSONS, parts: N5_PARTS, wordLevels: ["N5"] },
  { name: "N4", lessons: N4_LESSONS, parts: N4_PARTS, wordLevels: ["N4", "N5"] },
] as const;

const frenchTexts = (lesson: Lesson) => [
  // Textes en français seulement (ni le romaji ni le japonais des exemples).
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
];

describe.each(ENRICHED_COURSES)("cours $name (format enrichi)", ({ name, lessons, parts, wordLevels }) => {
  it("teaches vocabulary of its level and every kanji of its level, once", () => {
    const words = lessons.flatMap((lesson) => lesson.vocabulary ?? []);
    const offLevel = words.filter((word) => !(wordLevels as readonly string[]).includes(WORD_LEVELS[word.ja] ?? WORD_LEVELS[word.reading ?? ""] ?? ""));
    expect(offLevel.map((word) => word.ja)).toEqual([]);
    const kanji = lessons.flatMap((lesson) => lesson.kanji ?? []);
    expect(kanji.filter((char) => JLPT_KANJI.find((entry) => entry.kanji === char)?.level !== name)).toEqual([]);
    expect(new Set(kanji).size).toBe(kanji.length);
    const missing = JLPT_KANJI.filter((entry) => entry.level === name && !kanji.includes(entry.kanji)).map((entry) => entry.kanji);
    expect(missing).toEqual([]);
  });

  it("puts every lesson in a part, in order", () => {
    expect(parts.flatMap((part) => part.lessonIds)).toEqual(lessons.map((lesson) => lesson.id));
  });

  it("closes every colour mark, the same in Japanese, reading and romaji", () => {
    for (const lesson of lessons) {
      const texts = [
        ...frenchTexts(lesson),
        ...lesson.sections.flatMap((section) => (section.examples ?? []).flatMap((example) => [example.ja, example.reading ?? "", example.romaji ?? ""])),
      ];
      for (const text of texts) {
        expect(stripMarks(text), text).not.toMatch(/[[\]]|\*\*/);
      }
      for (const example of lesson.sections.flatMap((section) => section.examples ?? [])) {
        expect(example.fr, example.fr).not.toMatch(/[[\]]/);
        const count = (text: string | undefined) => (text?.match(/\[/g) ?? []).length;
        expect(count(example.reading), example.ja).toBe(count(example.ja));
        expect(count(example.romaji), example.ja).toBe(count(example.ja));
      }
    }
  });

  it("has complete romaji, and a QCM plus a writing step for each grammar lesson", () => {
    const entries = lessons.flatMap((lesson) => [...lesson.sections.flatMap((section) => section.examples ?? []), ...(lesson.vocabulary ?? [])]);
    expect(entries.filter((entry) => /[぀-ヿ一-龯]/.test(stripMarks(romajiOf(entry)))).map((entry) => entry.ja)).toEqual([]);
    for (const lesson of lessons.filter((candidate) => candidate.exercise.kind === "lesson-qcm")) {
      expect(lesson.writing, lesson.id).toBeDefined();
      const writing = lesson.writing!;
      expect(writing.questions.length, lesson.id).toBeGreaterThanOrEqual(writing.goal);
      for (const question of writing.questions) {
        // Au moins une réponse tapable au clavier sans kanji.
        expect(question.answers.some((answer) => !/[一-龯]/.test(answer)), question.fr).toBe(true);
      }
      if (lesson.exercise.kind === "lesson-qcm") {
        expect(lesson.exercise.questions.length, lesson.id).toBeGreaterThanOrEqual(lesson.goal);
        for (const question of lesson.exercise.questions) {
          expect(question.wrong, question.fr).not.toContain(question.answer);
          expect(new Set(question.wrong).size, question.fr).toBe(question.wrong.length);
        }
      }
    }
  });

  it("links to grammar points that exist", () => {
    const ids = new Set(grammarPoints.map((point) => point.id));
    for (const lesson of lessons) {
      const point = lesson.morePractice?.href.match(/point=([\w-]+)/)?.[1];
      if (point) expect(ids, lesson.id).toContain(point);
    }
  });

  it("is written in correct French", () => {
    const unknown = lessons
      .flatMap(frenchTexts)
      .map(stripMarks)
      .flatMap((text) => findUnknownWords(text))
      .filter((word) => !(word.includes("-") && word.split("-").every((part) => findUnknownWords(part).length === 0)));
    expect(unknown).toEqual([]);
  });
});
