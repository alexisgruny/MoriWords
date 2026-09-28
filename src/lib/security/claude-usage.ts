import { AsyncLocalStorage } from "node:async_hooks";

import { prisma } from "@/lib/db/prisma";
import { hitRateLimit } from "./rate-limit";

// Qui déclenche les appels à Claude de la requête en cours. Les appels
// partent de fonctions profondes (exemples, corrections, traductions...) :
// un contexte de requête évite de faire descendre userId dans chacune.
type ClaudeContext = { userId: string; action: string };

const storage = new AsyncLocalStorage<ClaudeContext>();

// À appeler dans une route, juste après requireUser : vaut pour la suite de
// cette requête uniquement (les autres requêtes ont leur propre contexte).
export function setClaudeContext(context: ClaudeContext) {
  storage.enterWith(context);
}

// Variante à portée limitée, pour les tests.
export function runWithClaudeContext<T>(context: ClaudeContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(context, fn);
}

export const USER_QUOTA_EXCEEDED_MESSAGE =
  "Tu as atteint ta limite de générations pour aujourd'hui. Réessaie demain.";

function readLimit(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

// Compte un appel réel à Claude dans le quota quotidien de l'utilisateur.
// Renvoie false si le quota est dépassé. Sans contexte (tâche de fond,
// tests), pas de quota par compte : le budget global s'applique seul.
export async function consumeUserClaudeQuota(now: Date = new Date()): Promise<boolean> {
  const context = storage.getStore();

  if (!context) {
    return true;
  }

  const { allowed, count } = await hitRateLimit(
    `claude:user:${context.userId}:day`,
    readLimit("CLAUDE_MAX_CALLS_PER_USER_PER_DAY", 150),
    24 * 60 * 60,
    now,
  );

  if (!allowed) {
    console.error(`Quota Claude atteint pour un compte (${count} appels aujourd'hui) : appel refusé.`);
  }

  return allowed;
}

// Enregistre les tokens consommés par un appel réussi. N'échoue jamais la
// requête : une ligne de suivi manquée n'empêche pas de répondre.
export async function recordClaudeUsage(usage: { input_tokens: number; output_tokens: number }) {
  const context = storage.getStore();

  if (!context) {
    return;
  }

  try {
    await prisma.claudeUsage.create({
      data: {
        userId: context.userId,
        action: context.action,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("Failed to record Claude usage:", error);
  }
}
