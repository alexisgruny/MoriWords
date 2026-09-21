import { prisma } from "@/lib/db/prisma";

import { classifyDifficulty } from "../difficulty/classify";
import type { JLPTLevel } from "../difficulty/classify";

export type TranslationResult = {
  translation: string;
  explanation: string;
  difficulty: JLPTLevel;
};

function parseJsonObject(value: string): Omit<TranslationResult, "difficulty"> | null {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "translation" in parsed &&
      "explanation" in parsed
    ) {
      const candidate = parsed as Partial<Omit<TranslationResult, "difficulty">>;

      if (
        typeof candidate.translation === "string" &&
        typeof candidate.explanation === "string"
      ) {
        return {
          translation: candidate.translation,
          explanation: candidate.explanation,
        };
      }
    }
  } catch {
    const translationMatch = value.match(/['"]translation['"]\s*:\s*['"]((?:\\.|[^'"])*)['"]/i);
    const explanationMatch = value.match(/['"]explanation['"]\s*:\s*['"]((?:\\.|[^'"])*)['"]/i);

    if (translationMatch && explanationMatch) {
      return {
        translation: translationMatch[1].replace(/\\(["'])/g, "$1"),
        explanation: explanationMatch[1].replace(/\\(["'])/g, "$1"),
      };
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
    throw new Error("Réponse Anthropic invalide.");
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

  throw new Error("Réponse Anthropic sans contenu exploitable.");
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

  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
          content: `Traduis ce terme ou cette expression de ${sourceLanguage} vers ${targetLanguage}. Réponds uniquement en JSON avec la structure suivante : {"translation":"...","explanation":"..."}.\n\nTexte : ${cleanedText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Anthropic API error: ${errorPayload || response.statusText}`);
  }

  const payload = await response.json();
  const result = parseAnthropicResponse(payload, cleanedText);

  await saveTranslation(cacheKey, sourceLanguage, targetLanguage, result);

  return result;
}
