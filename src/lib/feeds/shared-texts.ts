import { prisma } from "@/lib/db/prisma";

// Textes générés (répliques, dialogues, extraits, actus simplifiées) : ils ne
// contiennent rien de personnel, donc un texte généré pour un compte peut
// servir aux autres. Avant d'appeler Claude, on donne d'abord à l'utilisateur
// un texte récent de la même source qu'il n'a pas encore vu : Claude n'est
// appelé que quand il a déjà tout vu.
export const SHARED_ORIGINS = ["anime-quote", "daily-dialogue", "literary-excerpt", "news-summary"] as const;
export type SharedOrigin = (typeof SHARED_ORIGINS)[number];

const RECENT_DAYS = 30;
const MAX_CANDIDATES = 50;

export async function reuseSharedText(userId: string, origin: SharedOrigin, now: Date = new Date()) {
  const since = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const [candidates, alreadySeen] = await Promise.all([
    prisma.sourceText.findMany({
      where: { origin, userId: { not: userId }, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_CANDIDATES,
      select: { content: true, title: true, category: true, sourceLanguage: true, targetLanguage: true },
    }),
    prisma.sourceText.findMany({ where: { origin, userId }, select: { content: true } }),
  ]);

  const seen = new Set(alreadySeen.map((text) => text.content));
  const next = candidates.find((candidate) => !seen.has(candidate.content));

  if (!next) {
    return null;
  }

  // Copie à son nom : ses tokens, cartes et historique restent les siens.
  return prisma.sourceText.create({ data: { ...next, origin, userId } });
}
