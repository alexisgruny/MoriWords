import { prisma } from "@/lib/db/prisma";
import { MATURE_INTERVAL_DAYS } from "@/lib/decks/card-utils";
import { WORD_LEVELS, classifyDifficulty } from "@/lib/difficulty/classify";

export const PROGRESS_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type ProgressLevel = (typeof PROGRESS_LEVELS)[number];

// learned : mot réussi au moins une fois en révision ; mastered : revu avec
// au moins 3 semaines d'écart (même seuil que « bien ancré » ailleurs).
export type LevelProgress = { level: ProgressLevel; total: number; learned: number; mastered: number };

// Nombre de mots de chaque niveau dans les listes JLPT du site.
const TOTALS: Record<ProgressLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
for (const level of Object.values(WORD_LEVELS)) {
  TOTALS[level] += 1;
}

// « Tu connais 12 % du vocabulaire N5 » : les mots des decks de l'utilisateur
// rangés par niveau JLPT, chaque mot compté une fois (dans son meilleur état
// s'il est dans plusieurs decks). Aucun appel à Claude.
export async function getJlptProgress(userId: string): Promise<LevelProgress[]> {
  const cards = await prisma.card.findMany({
    where: { deck: { userId } },
    select: { lemma: true, reading: true, repetitions: true, interval: true },
  });

  const best = new Map<string, { level: ProgressLevel; learned: boolean; mastered: boolean }>();

  for (const card of cards) {
    // Index d'un Record : undefined possible même si le type ne le dit pas.
    const listed = WORD_LEVELS[card.lemma] as ProgressLevel | undefined;
    const level = listed ?? classifyDifficulty(card.lemma, card.reading, null);
    if (level === "unknown") {
      continue;
    }
    const current = best.get(card.lemma);
    best.set(card.lemma, {
      level,
      learned: (current?.learned ?? false) || card.repetitions > 0 || card.interval > 0,
      mastered: (current?.mastered ?? false) || card.interval >= MATURE_INTERVAL_DAYS,
    });
  }

  return PROGRESS_LEVELS.map((level) => {
    const words = [...best.values()].filter((word) => word.level === level);
    return {
      level,
      total: TOTALS[level],
      learned: words.filter((word) => word.learned).length,
      mastered: words.filter((word) => word.mastered).length,
    };
  });
}
