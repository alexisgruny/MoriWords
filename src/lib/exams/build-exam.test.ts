import { describe, expect, it } from "vitest";

import { EXAM_LEVELS, buildExam, gradeExam } from "./build-exam";

describe("examens de palier", () => {
  it.each(EXAM_LEVELS)("builds a full, valid exam for %s", (level) => {
    for (const seed of [1, 42, 123456]) {
      const exam = buildExam(level, seed);
      expect(exam.questions.length).toBeGreaterThanOrEqual(36);
      exam.questions.forEach((question, index) => {
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(exam.answers[index]).toBeGreaterThanOrEqual(0);
        expect(exam.answers[index]).toBeLessThan(4);
      });
    }
  });

  it("gives the same exam for the same seed, and a different one otherwise", () => {
    expect(buildExam("N5", 7)).toEqual(buildExam("N5", 7));
    expect(buildExam("N5", 7).questions).not.toEqual(buildExam("N5", 8).questions);
  });

  it("grades by category with a 75 % pass mark", () => {
    const exam = buildExam("N4", 3);
    const perfect = gradeExam(exam, exam.answers);
    expect(perfect.score).toBe(exam.questions.length);
    expect(perfect.passed).toBe(true);

    const allWrong = gradeExam(exam, exam.answers.map((answer) => (answer + 1) % 4));
    expect(allWrong.score).toBe(0);
    expect(allWrong.passed).toBe(false);
    expect(allWrong.byCategory["kanji-sens"]?.total).toBeGreaterThan(0);

    const needed = Math.ceil(exam.questions.length * 0.75);
    const justEnough = exam.answers.map((answer, index) => (index < needed ? answer : (answer + 1) % 4));
    expect(gradeExam(exam, justEnough).passed).toBe(true);
  });
});
