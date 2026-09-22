import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

import { classifyDifficulty } from "../difficulty/classify";
import type { JLPTLevel } from "../difficulty/classify";

export type TranslationResult = {
  translation: string;
  explanation: string;
  difficulty: JLPTLevel;
};

const translationPayloadSchema = z.object({
  translation: z.string().min(1),
  explanation: z.string().min(1),
});

const ANTHROPIC_TIMEOUT_MS = 20_000;

export class TranslationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationServiceError";
  }
}

function parseJsonObject(value: string): Omit<TranslationResult, "difficulty"> | null {
  try {
    const parsed = z.unknown().parse(JSON.parse(value));
    const result = translationPayloadSchema.safeParse(parsed);

    if (result.success) {
      return result.data;
    }
  } catch {
    const translationMatch = value.match(/['"]translation['"]\s*:\s*['"]((?:\\.|[^'"])*)['"]/i);
    const explanationMatch = value.match(/['"]explanation['"]\s*:\s*['"]((?:\\.|[^'"])*)['"]/i);

    if (translationMatch && explanationMatch) {
      const result = translationPayloadSchema.safeParse({
        translation: translationMatch[1].replace(/\\(["'])/g, "$1"),
        explanation: explanationMatch[1].replace(/\\(["'])/g, "$1"),
      });

      if (result.success) {
        return result.data;
      }
    }
  }

  return null;
}

function extractTranslationPayload(rawText: string): Omit<TranslationResult, "difficulty"> | null {
  const normalized = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const candidates = [normalized];

  const matches = normalized.match(/\{[\s\S]*?\}/g) ?? [];
  for (const match of matches) {
    candidates.push(match);
  }

  const startIndex = normalized.indexOf("{");
  const endIndex = normalized.lastIndexOf("}");
  if (startIndex >= 0 && endIndex > startIndex) {
    candidates.push(normalized.slice(startIndex, endIndex + 1));
  }

  for (const candidate of candidates) {
    const parsed = parseJsonObject(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function parseAnthropicResponse(payload: unknown, fallbackLemma: string): TranslationResult {
  if (typeof payload !== "object" || payload === null) {
    throw new TranslationServiceError("Réponse de traduction invalide. Réessaie dans un instant.");
  }

  const candidate = payload as Record<string, unknown>;

  if (Array.isArray(candidate.content)) {
    for (const entry of candidate.content) {
      if (
        typeof entry === "object" &&
        entry !== null &&
        "type" in entry &&
        (entry as { type?: unknown }).type === "text" &&
        "text" in entry
      ) {
        const rawText = String((entry as { text: unknown }).text);
        const parsed = extractTranslationPayload(rawText);

        if (parsed) {
          return {
            translation: parsed.translation,
            explanation: parsed.explanation,
            difficulty: classifyDifficulty(fallbackLemma, null, null),
          };
        }
      }
    }
  }

  console.error("Anthropic response had no exploitable content:", JSON.stringify(payload));
  throw new TranslationServiceError("Le service de traduction n'a pas renvoyé de résultat exploitable.");
}

async function getCachedTranslation(
  lemma: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<TranslationResult | null> {
  const cached = await prisma.translationCache.findUnique({
    where: {
      lemma_sourceLanguage_targetLanguage: {
        lemma,
        sourceLanguage,
        targetLanguage,
      },
    },
  });

  if (!cached) {
    return null;
  }

  return {
    translation: cached.translation,
    explanation: cached.explanation,
    difficulty:
      (cached.difficulty as TranslationResult["difficulty"]) ??
      classifyDifficulty(cached.lemma, null, null),
  };
}

async function saveTranslation(
  lemma: string,
  sourceLanguage: string,
  targetLanguage: string,
  result: TranslationResult,
) {
  await prisma.translationCache.upsert({
    where: {
      lemma_sourceLanguage_targetLanguage: {
        lemma,
        sourceLanguage,
        targetLanguage,
      },
    },
    update: {
      translation: result.translation,
      explanation: result.explanation,
      difficulty: result.difficulty,
    },
    create: {
      lemma,
      sourceLanguage,
      targetLanguage,
      translation: result.translation,
      explanation: result.explanation,
      difficulty: result.difficulty,
    },
  });
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<TranslationResult> {
  const cleanedText = text.trim();
  const cacheKey = cleanedText || text;

  if (!cacheKey) {
    return {
      translation: "",
      explanation: "Aucun texte à traduire.",
      difficulty: "N5",
    };
  }

  const cached = await getCachedTranslation(cacheKey, sourceLanguage, targetLanguage);

  if (cached) {
    return cached;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      translation: "À compléter",
      explanation: `Anthropic API key manquante. La traduction réelle arrivera quand la clé sera configurée pour ${sourceLanguage} → ${targetLanguage}.`,
      difficulty: classifyDifficulty(cleanedText, null, null),
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `Traduis ce texte de ${sourceLanguage} vers ${targetLanguage}. S'il s'agit d'une phrase, conserve son sens et son ton naturels. Réponds uniquement en JSON avec la structure suivante : {"translation":"...","explanation":"..."}.\n\nTexte : ${cleanedText}`,
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new TranslationServiceError(
        "Le service de traduction met trop de temps à répondre. Réessaie dans un instant.",
      );
    }

    console.error("Anthropic request failed:", fetchError);
    throw new TranslationServiceError("Le service de traduction est injoignable pour le moment.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error(`Anthropic API error (${response.status}):`, errorPayload || response.statusText);
    throw new TranslationServiceError(
      "Le service de traduction est momentanément indisponible. Réessaie plus tard.",
    );
  }

  const payload = await response.json();
  const result = parseAnthropicResponse(payload, cleanedText);

  await saveTranslation(cacheKey, sourceLanguage, targetLanguage, result);

  return result;
}
