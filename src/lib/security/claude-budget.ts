import { hitRateLimit } from "./rate-limit";

// Plafond global d'appels réels à Claude (après les caches), tous visiteurs
// confondus : protège le crédit Anthropic même si un attaquant change d'IP
// pour contourner la limite par IP. Réglable par variables d'environnement.
// Ordre de grandeur : ~0,003 $ par appel, donc 600 appels/jour ≈ 2 $ au pire.
function readLimit(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const CLAUDE_BUDGET_EXCEEDED_MESSAGE =
  "Le service est très sollicité en ce moment. Réessaie un peu plus tard.";

// Compte un appel à Claude sur l'heure et sur la journée en cours. Renvoie
// false si l'un des deux plafonds est dépassé : l'appelant ne doit alors pas
// appeler l'API.
export async function consumeClaudeBudget(now: Date = new Date()): Promise<boolean> {
  const hourly = await hitRateLimit(
    "claude:global:hour",
    readLimit("CLAUDE_MAX_CALLS_PER_HOUR", 200),
    60 * 60,
    now,
  );
  const daily = await hitRateLimit(
    "claude:global:day",
    readLimit("CLAUDE_MAX_CALLS_PER_DAY", 600),
    24 * 60 * 60,
    now,
  );

  if (!hourly.allowed || !daily.allowed) {
    console.error(
      `Budget Claude atteint (heure : ${hourly.count}, jour : ${daily.count}) : appel refusé.`,
    );
    return false;
  }

  return true;
}
