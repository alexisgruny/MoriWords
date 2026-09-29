import { prisma } from "@/lib/db/prisma";
import { MATURE_INTERVAL_DAYS } from "@/lib/decks/card-utils";
import { computeStreak, type Streak } from "@/lib/srs/streak";

export type TodaySummary = {
  dueCount: number;
  totalCards: number;
  // Cartes revues avec un intervalle d'au moins 3 semaines : « bien ancrées ».
  matureCards: number;
  reviewsToday: number;
  streak: Streak;
};

// Ce qu'il y a à faire aujourd'hui, pour le bloc en haut de l'accueil :
// Léa revient 15 minutes par jour et doit voir tout de suite quoi réviser.
export async function getTodaySummary(userId: string, now: Date = new Date()): Promise<TodaySummary> {
  const ownCards = { deck: { userId } };
  // Début de la journée dans le fuseau du serveur, comme computeStreak.
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [dueCount, totalCards, matureCards, reviewsToday, reviewDates] = await Promise.all([
    prisma.card.count({ where: { ...ownCards, dueAt: { lte: now } } }),
    prisma.card.count({ where: ownCards }),
    prisma.card.count({ where: { ...ownCards, interval: { gte: MATURE_INTERVAL_DAYS } } }),
    prisma.reviewLog.count({ where: { card: ownCards, reviewedAt: { gte: startOfDay } } }),
    prisma.reviewLog.findMany({ where: { card: ownCards }, select: { reviewedAt: true } }),
  ]);

  return {
    dueCount,
    totalCards,
    matureCards,
    reviewsToday,
    streak: computeStreak(
      reviewDates.map((log) => log.reviewedAt),
      now,
    ),
  };
}
