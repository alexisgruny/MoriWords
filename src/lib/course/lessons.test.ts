import { describe, expect, it, vi } from "vitest";

import { conjugationForms } from "@/lib/conjugation/forms";
import { WORD_LEVELS } from "@/lib/difficulty/classify";
import { grammarPoints } from "@/lib/grammar/points";
import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { findUnknownWords } from "@/lib/spellcheck/check-french";
import { LESSONS } from "./lessons";

vi.setConfig({ testTimeout: 30_000 });

// Écriture du dictionnaire des mots donnés en kana (がくせい -> 学生), pour
// trouver leur niveau dans les listes JLPT.
const DICTIONARY_FORMS: Record<string, string> = {
  わたし: "私", がくせい: "学生", せんせい: "先生", ともだち: "友達", ほん: "本", ねこ: "猫", いぬ: "犬",
  すき: "好き", たべます: "食べる", のみます: "飲む", いきます: "行く", みます: "見る", えいが: "映画",
  おちゃ: "お茶", みず: "水", よみます: "読む", かえります: "帰る", がっこう: "学校", こうえん: "公園",
  としょかん: "図書館", でんしゃ: "電車", かきます: "書く", ねます: "寝る", おきます: "起きる",
  きのう: "昨日", きょう: "今日", あした: "明日", たかい: "高い", やすい: "安い",
  おおきい: "大きい", ちいさい: "小さい", しずか: "静か", げんき: "元気",
};

// Hors liste N5 mais connus d'un débutant francophone : emprunts passés en
// français (anime, sushi) et noms de pays.
const FAMILIAR_WORDS = new Set(["アニメ", "すし", "日本", "日本人", "フランス人"]);

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

  it("only teaches N5 vocabulary (apart from a few familiar words)", () => {
    const tooHard = LESSONS.flatMap((lesson) =>
      (lesson.vocabulary ?? [])
        .filter((word) => !FAMILIAR_WORDS.has(word.ja))
        .filter((word) => WORD_LEVELS[DICTIONARY_FORMS[word.ja] ?? word.ja] !== "N5")
        .map((word) => `${lesson.id} : ${word.ja}`),
    );
    expect(tooHard).toEqual([]);
  });

  it("builds every QCM answer from the lesson's own vocabulary", () => {
    // Chaque réponse contient au moins un mot de la liste de la leçon (radical
    // sans ます ni い final, pour たべたい, たかくない...) ; いい se conjugue
    // sur よ (よかった).
    for (const lesson of LESSONS) {
      if (lesson.exercise.kind !== "lesson-qcm" || !lesson.vocabulary) continue;
      const stems = lesson.vocabulary.map((word) =>
        word.ja === "いい" ? "よ" : word.ja.replace(/ます$/, "").replace(/い$/, ""),
      );
      for (const question of lesson.exercise.questions) {
        expect(stems.some((stem) => question.answer.includes(stem)), `${lesson.id} : ${question.answer}`).toBe(true);
      }
    }
  });

  it("gives every lesson question one right answer, distinct from its traps", () => {
    for (const lesson of LESSONS) {
      if (lesson.exercise.kind !== "lesson-qcm") continue;
      const answers = lesson.exercise.questions.map((question) => question.answer);
      expect(new Set(answers).size, lesson.id).toBe(answers.length);
      expect(answers.length, lesson.id).toBeGreaterThanOrEqual(lesson.goal);
      for (const question of lesson.exercise.questions) {
        expect(question.wrong.length, question.fr).toBeGreaterThanOrEqual(1);
        expect(question.wrong, question.fr).not.toContain(question.answer);
      }
    }
  });

  it("is written in correct French", () => {
    const texts = LESSONS.flatMap((lesson) => [
      lesson.title,
      lesson.summary,
      ...lesson.sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.examples ?? []).map((example) => example.fr)]),
      ...(lesson.exercise.kind === "reading" ? [lesson.exercise.translation] : []),
      ...(lesson.exercise.kind === "lesson-qcm" ? lesson.exercise.questions.map((question) => question.fr) : []),
      ...(lesson.vocabulary ?? []).map((word) => word.fr),
      ...(lesson.morePractice ? [lesson.morePractice.label] : []),
    ]);
    // Un mot à trait d'union (Lis-les, su-shi) est bon si chacune de ses
    // parties l'est : le vérificateur le prend d'un seul bloc.
    const unknown = texts
      .flatMap((text) => findUnknownWords(text))
      .filter((word) => !(word.includes("-") && word.split("-").every((part) => findUnknownWords(part).length === 0)));
    expect(unknown).toEqual([]);
  });
});
