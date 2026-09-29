import { describe, expect, it } from "vitest";

import { conjugationForms } from "@/lib/conjugation/forms";
import { grammarPoints } from "@/lib/grammar/points";
import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { findUnknownWords } from "@/lib/spellcheck/check-french";
import { LESSONS } from "./lessons";

describe("parcours débutant", () => {
  it("has 10 lessons with unique ids, numbered in order", () => {
    expect(LESSONS).toHaveLength(10);
    expect(new Set(LESSONS.map((lesson) => lesson.id)).size).toBe(10);
    expect(LESSONS.map((lesson) => lesson.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("only points to exercises that exist on the site", () => {
    const patterns = new Set(grammarPoints.map((point) => point.pattern));
    const forms = new Set(conjugationForms.map((form) => form.name));
    const kanji = new Set(JLPT_KANJI.map((entry) => entry.kanji));

    for (const lesson of LESSONS) {
      const exercise = lesson.exercise;
      if (exercise.kind === "grammar") exercise.patterns.forEach((pattern) => expect(patterns, lesson.id).toContain(pattern));
      if (exercise.kind === "conjugation") exercise.forms.forEach((form) => expect(forms, lesson.id).toContain(form));
      if (exercise.kind === "kanji") exercise.kanji.forEach((char) => expect(kanji, lesson.id).toContain(char));
    }
  });

  it("is written in correct French", () => {
    const texts = LESSONS.flatMap((lesson) => [
      lesson.title,
      lesson.summary,
      ...lesson.sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.examples ?? []).map((example) => example.fr)]),
      ...(lesson.exercise.kind === "reading" ? [lesson.exercise.translation] : []),
    ]);
    // Un mot à trait d'union (Lis-les, su-shi) est bon si chacune de ses
    // parties l'est : le vérificateur le prend d'un seul bloc.
    const unknown = texts
      .flatMap((text) => findUnknownWords(text))
      .filter((word) => !(word.includes("-") && word.split("-").every((part) => findUnknownWords(part).length === 0)));
    expect(unknown).toEqual([]);
  });
});
