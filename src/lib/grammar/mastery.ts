import { prisma } from "@/lib/db/prisma";
import { JLPT_KANJI } from "@/lib/kanji/kanji";

import type { ExerciseSource } from "./exercises";

// Réussite par élément (kana, kanji, point de grammaire, forme de
// conjugaison), pour colorer les pages de référence : vert si acquis,
// orange si fragile, rouge si à revoir, rien si jamais essayé.
export type MasteryKind = "kana" | "kanji" | "grammar" | "conjugation";
export const MASTERY_KINDS: MasteryKind[] = ["kana", "kanji", "grammar", "conjugation"];

export type MasteryStat = { total: number; correct: number };

const SOURCES: Record<MasteryKind, ExerciseSource[]> = {
  kana: ["kana"],
  // Les deux sens de l'exercice (sens et lecture) comptent pour le kanji.
  kanji: ["kanji", "kanji-reading"],
  grammar: ["grammar"],
  conjugation: ["conjugation"],
};

// Avant, une tentative de kanji enregistrait ses lectures plutôt que le
// caractère : on les ramène au kanji correspondant.
const kanjiByReadings = new Map(
  JLPT_KANJI.map((entry) => [[...entry.onReadings, ...entry.kunReadings].join("・"), entry.kanji]),
);

export async function getMastery(userId: string, kind: MasteryKind): Promise<Record<string, MasteryStat>> {
  const where = { userId, source: { in: SOURCES[kind] } };
  const [totals, corrects] = await Promise.all([
    prisma.exerciseAttempt.groupBy({ by: ["focus"], where, _count: { _all: true } }),
    prisma.exerciseAttempt.groupBy({ by: ["focus"], where: { ...where, correct: true }, _count: { _all: true } }),
  ]);

  const keyOf = (focus: string) => (kind === "kanji" ? (kanjiByReadings.get(focus) ?? focus) : focus);
  const items: Record<string, MasteryStat> = {};

  for (const row of totals) {
    const stat = (items[keyOf(row.focus)] ??= { total: 0, correct: 0 });
    stat.total += row._count._all;
  }

  for (const row of corrects) {
    const stat = items[keyOf(row.focus)];
    if (stat) {
      stat.correct += row._count._all;
    }
  }

  return items;
}
