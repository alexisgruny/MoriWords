import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { classifyDifficulty } from "@/lib/difficulty/classify";
import { generateJsonFromClaude } from "@/lib/feeds/claude-json-generator";

// Nombre de phrases d'exemple créées pour chaque carte.
export const EXAMPLES_PER_CARD = 5;

export type GeneratedExample = {
  japanese: string;
  reading: string | null;
  translation: string;
};

const examplesPayloadSchema = z.object({
  examples: z
    .array(
      z.object({
        japanese: z.string().min(1),
        reading: z.string().optional(),
        translation: z.string().min(1),
      }),
    )
    .min(1),
});

export class ExampleServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExampleServiceError";
  }
}

// Demande à Claude 5 phrases simples contenant le mot, adaptées à son niveau
// JLPT (un mot N5 reçoit des phrases N5, pas des phrases de journal).
export async function generateExamples(lemma: string): Promise<GeneratedExample[]> {
  const level = classifyDifficulty(lemma, null, null);
  const levelLabel = level === "unknown" ? "N5" : level;

  const payload = await generateJsonFromClaude({
    prompt: `Le mot japonais à illustrer est « ${lemma} ». Écris ${EXAMPLES_PER_CARD} phrases d'exemple en japonais. Règle impérative : le mot « ${lemma} » (tel quel ou conjugué à partir de son radical) doit apparaître littéralement dans chacune des ${EXAMPLES_PER_CARD} phrases japonaises que tu écris ; une phrase qui ne contient pas ce mot est invalide et ne doit pas être renvoyée. Chaque phrase doit être courte et simple, avec une grammaire et un vocabulaire du niveau JLPT ${levelLabel} (jamais plus difficile que ce niveau), et illustrer un contexte différent (vie quotidienne, école, famille, magasin, etc.). Donne pour chacune la lecture complète en hiragana et la traduction en français. Réponds uniquement en JSON avec la structure suivante : {"examples":[{"japanese":"...(contient ${lemma})...","reading":"...","translation":"..."}]}.`,
    schema: examplesPayloadSchema,
    maxTokens: 900,
    timeoutMs: 25_000,
    createError: (message) => new ExampleServiceError(message),
    messages: {
      missingApiKey: "La clé API Anthropic n'est pas configurée.",
      timeout: "La génération d'exemples met trop de temps à répondre.",
      networkError: "Le service d'exemples est injoignable pour le moment.",
      httpError: "Le service d'exemples est momentanément indisponible.",
      empty: "Réponse d'exemples vide.",
      invalid: "Le service d'exemples n'a pas renvoyé de résultat exploitable.",
    },
  });

  return payload.examples.slice(0, EXAMPLES_PER_CARD).map((example) => ({
    japanese: example.japanese.trim(),
    reading: example.reading?.trim() || null,
    translation: example.translation.trim(),
  }));
}

// Comme generateExamples mais ne lève jamais d'erreur : en cas d'échec ou de
// clé API absente, renvoie null et la carte est simplement créée sans exemples.
export async function tryGenerateExamples(lemma: string): Promise<GeneratedExample[] | null> {
  try {
    return await generateExamples(lemma);
  } catch (error) {
    console.error("Example generation failed:", error);
    return null;
  }
}

// Enregistre les exemples d'une carte, sauf si elle en a déjà (jamais de doublons
// ni d'écrasement de contextes existants).
export async function saveExamples(cardId: string, examples: GeneratedExample[]): Promise<number> {
  const existing = await prisma.cardExample.count({ where: { cardId } });

  if (existing > 0 || examples.length === 0) {
    return existing;
  }

  await prisma.cardExample.createMany({
    data: examples.map((example, position) => ({ cardId, position, ...example })),
  });

  return examples.length;
}
