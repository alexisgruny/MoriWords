import { randomInt } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { EXAM_LEVELS, buildExam, gradeExam } from "@/lib/exams/build-exam";
import type { ExamQuestion } from "@/lib/exams/types";
import type { GrammarLevel } from "@/lib/grammar/points";

const HOUR = 60 * 60 * 1000;
// Temps pour finir un examen commencé : au-delà, il compte comme raté.
export const EXAM_DURATION_MS = 3 * HOUR;
// Délai avant de repasser un palier raté (évite le « par cœur »).
export const RETRY_DELAY_MS = 24 * HOUR;

export function isExamLevel(value: unknown): value is GrammarLevel {
  return typeof value === "string" && (EXAM_LEVELS as string[]).includes(value);
}

export type LevelStatus = {
  level: GrammarLevel;
  passed: boolean;
  bestScore: number | null;
  total: number | null;
  // Examen en cours à reprendre, ou date à partir de laquelle on peut repasser.
  inProgress: boolean;
  retryAt: string | null;
};

export async function getExamStatuses(userId: string, now = new Date()): Promise<LevelStatus[]> {
  const attempts = await prisma.examAttempt.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    select: { level: true, startedAt: true, finishedAt: true, score: true, total: true, passed: true },
  });

  return EXAM_LEVELS.map((level) => {
    const forLevel = attempts.filter((attempt) => attempt.level === level);
    const best = forLevel.reduce<(typeof forLevel)[number] | null>(
      (current, attempt) => (attempt.score !== null && (current === null || attempt.score > (current.score ?? -1)) ? attempt : current),
      null,
    );
    const latest = forLevel[0];
    const inProgress = Boolean(latest && !latest.finishedAt && now.getTime() - latest.startedAt.getTime() < EXAM_DURATION_MS);
    const retryAt =
      latest && !inProgress && latest.passed !== true && now.getTime() - latest.startedAt.getTime() < RETRY_DELAY_MS
        ? new Date(latest.startedAt.getTime() + RETRY_DELAY_MS).toISOString()
        : null;
    return {
      level,
      passed: forLevel.some((attempt) => attempt.passed === true),
      bestScore: best?.score ?? null,
      total: best?.total ?? null,
      inProgress,
      retryAt,
    };
  });
}

export type StartResult =
  | { ok: true; attemptId: string; questions: ExamQuestion[] }
  | { ok: false; retryAt: string };

// Commence un examen, ou reprend celui en cours (mêmes questions : on ne peut
// pas relancer le tirage). Après un échec, il faut attendre 24 h.
export async function startExam(userId: string, level: GrammarLevel, now = new Date()): Promise<StartResult> {
  const latest = await prisma.examAttempt.findFirst({ where: { userId, level }, orderBy: { startedAt: "desc" } });
  const age = latest ? now.getTime() - latest.startedAt.getTime() : Infinity;

  if (latest && !latest.finishedAt && age < EXAM_DURATION_MS) {
    return { ok: true, attemptId: latest.id, questions: buildExam(level, latest.seed).questions };
  }
  if (latest && latest.passed !== true && age < RETRY_DELAY_MS) {
    return { ok: false, retryAt: new Date(latest.startedAt.getTime() + RETRY_DELAY_MS).toISOString() };
  }

  const seed = randomInt(1, 2 ** 31 - 1);
  const exam = buildExam(level, seed);
  const attempt = await prisma.examAttempt.create({
    data: { userId, level, seed, total: exam.questions.length, startedAt: now },
    select: { id: true },
  });
  return { ok: true, attemptId: attempt.id, questions: exam.questions };
}

export type SubmitResult =
  | { ok: true; score: number; total: number; passed: boolean; byCategory: ReturnType<typeof gradeExam>["byCategory"]; answers: number[] }
  | { ok: false; status: 404 | 409 | 400; error: string };

// Corrige un examen du compte (regénéré à partir de sa graine).
export async function submitExam(userId: string, attemptId: string, given: number[], now = new Date()): Promise<SubmitResult> {
  const attempt = await prisma.examAttempt.findFirst({ where: { id: attemptId, userId } });
  if (!attempt || !isExamLevel(attempt.level)) {
    return { ok: false, status: 404, error: "Examen introuvable." };
  }
  if (attempt.finishedAt || now.getTime() - attempt.startedAt.getTime() > EXAM_DURATION_MS) {
    return { ok: false, status: 409, error: "Cet examen est terminé." };
  }

  const exam = buildExam(attempt.level, attempt.seed);
  if (given.length !== exam.questions.length) {
    return { ok: false, status: 400, error: "Réponses incomplètes." };
  }
  const result = gradeExam(exam, given);

  // updateMany avec finishedAt: null : une double soumission ne corrige qu'une fois.
  const updated = await prisma.examAttempt.updateMany({
    where: { id: attempt.id, finishedAt: null },
    data: { finishedAt: now, score: result.score, passed: result.passed, results: result.byCategory },
  });
  if (updated.count === 0) {
    return { ok: false, status: 409, error: "Cet examen est terminé." };
  }
  return { ok: true, ...result, answers: exam.answers };
}
