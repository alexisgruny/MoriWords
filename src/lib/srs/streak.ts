// Calcule la série de jours consécutifs avec au moins une révision, à partir
// des dates de ReviewLog (tous decks confondus : la régularité globale compte,
// pas par deck). Logique pure et testable, séparée de l'accès à la base.

// Journée locale (fuseau du serveur) sous forme "YYYY-MM-DD", pour regrouper
// les révisions par jour sans dépendre de l'heure exacte.
function dayKey(date: Date): string {
  return date.toLocaleDateString("en-CA"); // format AAAA-MM-JJ, indépendant de la locale d'affichage
}

function addDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

export type Streak = {
  // Jours consécutifs jusqu'à aujourd'hui inclus, ou jusqu'à hier si rien
  // n'a encore été révisé aujourd'hui (la série n'est pas encore rompue).
  currentStreak: number;
  // La plus longue série jamais atteinte (peut être égale à currentStreak).
  longestStreak: number;
  reviewedToday: boolean;
};

// reviewDates : une entrée par révision (doublons dans un même jour sans
// effet, pas besoin de dédupliquer avant l'appel).
export function computeStreak(reviewDates: Date[], now: Date = new Date()): Streak {
  const days = new Set(reviewDates.map(dayKey));

  if (days.size === 0) {
    return { currentStreak: 0, longestStreak: 0, reviewedToday: false };
  }

  const todayKey = dayKey(now);
  const reviewedToday = days.has(todayKey);

  // Part d'aujourd'hui s'il a une révision, sinon d'hier (la série tient
  // encore tant que la journée en cours n'est pas terminée sans révision).
  let cursor = reviewedToday ? now : addDays(now, -1);
  let currentStreak = 0;

  while (days.has(dayKey(cursor))) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  // La plus longue série : balaie tous les jours triés et compte les runs
  // consécutifs (les jours sont peu nombreux pour un usage personnel, pas
  // besoin d'un algorithme plus fin).
  const sortedDays = [...days].sort();
  let longestStreak = 0;
  let running = 0;
  let previousDay: Date | null = null;

  for (const key of sortedDays) {
    const [year, month, day] = key.split("-").map(Number);
    const current = new Date(year, month - 1, day);

    if (previousDay && dayKey(addDays(previousDay, 1)) === key) {
      running += 1;
    } else {
      running = 1;
    }

    longestStreak = Math.max(longestStreak, running);
    previousDay = current;
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak), reviewedToday };
}
