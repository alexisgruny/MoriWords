import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

import { classifyDifficulty } from "../difficulty/classify";
import type { JLPTLevel } from "../difficulty/classify";

// Le résultat d'une traduction : le texte traduit, une courte explication et
// le niveau JLPT du mot ou de la phrase.
export type TranslationResult = {
  translation: string;
  explanation: string;
  difficulty: JLPTLevel;
};

// Forme attendue de la réponse JSON de Claude.
const translationPayloadSchema = z.object({
  translation: z.string().min(1),
  explanation: z.string().min(1),
});

// Délai maximum d'attente de la réponse de Claude avant d'abandonner.
const ANTHROPIC_TIMEOUT_MS = 20_000;

// Texte renvoyé à la place d'une vraie traduction quand la clé API Anthropic
// manque : à ne jamais enregistrer comme sens d'une carte.
export const MISSING_TRANSLATION_PLACEHOLDER = "À compléter";

// Erreur levée quand la traduction échoue, avec un message compréhensible
// pour l'utilisateur (jamais le détail technique brut de l'API).
export class TranslationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationServiceError";
  }
}

// Essaie d'interpréter une chaîne comme le JSON attendu {translation, explanation}.
// Si le JSON est mal formé, tente un repêchage par expression régulière avant
// d'abandonner.
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

// Extrait l'objet JSON de la traduction depuis le texte brut renvoyé par
// Claude, même s'il est entouré de texte ou d'un bloc de code markdown.
// Essaie plusieurs candidats (texte entier, sous-blocs {...}) avant d'abandonner.
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

// Transforme la réponse de l'API Anthropic en TranslationResult, en y
// ajoutant le niveau JLPT calculé localement (Claude ne le fournit pas).
function parseAnthropicResponse(content: Anthropic.ContentBlock[], fallbackLemma: string): TranslationResult {
  for (const block of content) {
    if (block.type === "text") {
      const parsed = extractTranslationPayload(block.text);

      if (parsed) {
        return {
          translation: parsed.translation,
          explanation: parsed.explanation,
          difficulty: classifyDifficulty(fallbackLemma, null, null),
        };
      }
    }
  }

  console.error("Anthropic response had no exploitable content:", JSON.stringify(content));
  throw new TranslationServiceError("Le service de traduction n'a pas renvoyé de résultat exploitable.");
}

// Cherche une traduction déjà calculée en base pour éviter d'appeler
// l'API à chaque fois pour le même mot ou la même phrase.
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

// Enregistre une traduction en base pour pouvoir la réutiliser la prochaine fois.
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

// Traduit un mot ou une phrase du japonais vers le français (ou toute autre
// paire de langues). Vérifie d'abord le cache, puis appelle Claude si
// nécessaire, et enregistre le résultat pour la prochaine fois. Sans clé API
// configurée, renvoie un texte de remplacement plutôt que d'échouer.
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  context?: string,
): Promise<TranslationResult> {
  const cleanedText = text.trim();
  const cacheKey = cleanedText || text;
  const cleanedContext = context?.trim() || null;
  // Une traduction contextualisée peut différer du sens générique du mot :
  // on ne la lit ni ne l'écrit dans le cache pour ne pas polluer les futures
  // traductions hors contexte de ce même mot.
  const useCache = !cleanedContext || cleanedContext === cleanedText;

  if (!cacheKey) {
    return {
      translation: "",
      explanation: "Aucun texte à traduire.",
      difficulty: "N5",
    };
  }

  if (useCache) {
    const cached = await getCachedTranslation(cacheKey, sourceLanguage, targetLanguage);

    if (cached) {
      return cached;
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      translation: MISSING_TRANSLATION_PLACEHOLDER,
      explanation: `Anthropic API key manquante. La traduction réelle arrivera quand la clé sera configurée pour ${sourceLanguage} → ${targetLanguage}.`,
      difficulty: classifyDifficulty(cleanedText, null, null),
    };
  }

  const client = new Anthropic({ apiKey });

  let message: Anthropic.Message;

  try {
    // Demande à Claude de traduire le texte et d'expliquer brièvement son sens.
    message = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: useCache
              ? `Traduis ce texte de ${sourceLanguage} vers ${targetLanguage}. S'il s'agit d'une phrase, conserve son sens et son ton naturels. Réponds uniquement en JSON avec la structure suivante : {"translation":"...","explanation":"..."}.\n\nTexte : ${cleanedText}`
              : `Traduis ce mot ou groupe de mots de ${sourceLanguage} vers ${targetLanguage} en tenant compte du sens qu'il a dans la phrase de contexte ci-dessous (désambiguïse-le si besoin). L'explication doit préciser son sens précis dans ce contexte. Réponds uniquement en JSON avec la structure suivante : {"translation":"...","explanation":"..."}.\n\nPhrase de contexte : ${cleanedContext}\nMot à traduire : ${cleanedText}`,
          },
        ],
      },
      { timeout: ANTHROPIC_TIMEOUT_MS },
    );
  } catch (apiError) {
    // Distingue un simple délai dépassé d'une vraie panne réseau ou d'une erreur HTTP.
    if (apiError instanceof Anthropic.APIConnectionTimeoutError) {
      throw new TranslationServiceError(
        "Le service de traduction met trop de temps à répondre. Réessaie dans un instant.",
      );
    }

    if (apiError instanceof Anthropic.APIConnectionError) {
      console.error("Anthropic request failed:", apiError);
      throw new TranslationServiceError("Le service de traduction est injoignable pour le moment.");
    }

    if (apiError instanceof Anthropic.APIError) {
      console.error(`Anthropic API error (${apiError.status}):`, apiError.message);
      throw new TranslationServiceError(
        "Le service de traduction est momentanément indisponible. Réessaie plus tard.",
      );
    }

    throw apiError;
  }

  const result = parseAnthropicResponse(message.content, cleanedText);

  // Mémorise le résultat pour ne pas refaire le même appel plus tard, sauf
  // s'il est spécifique à un contexte (voir useCache ci-dessus).
  if (useCache) {
    await saveTranslation(cacheKey, sourceLanguage, targetLanguage, result);
  }

  return result;
}

// Pioche un échantillon de traductions déjà en cache pour servir de leurres
// dans le mode quiz du deck (jamais d'appel à Claude ici). Tire une fenêtre
// aléatoire du cache plutôt que de trier par RANDOM() côté base pour rester
// sur l'API standard de Prisma.
export async function getDistractorTranslations(
  excludeMeanings: string[],
  count: number,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string[]> {
  if (count <= 0) {
    return [];
  }

  const where = {
    sourceLanguage,
    targetLanguage,
    translation: { notIn: excludeMeanings },
  };

  const total = await prisma.translationCache.count({ where });

  if (total === 0) {
    return [];
  }

  const windowSize = Math.min(total, count * 5);
  const maxSkip = Math.max(0, total - windowSize);
  const skip = Math.floor(Math.random() * (maxSkip + 1));

  const entries = await prisma.translationCache.findMany({
    where,
    select: { translation: true },
    skip,
    take: windowSize,
  });

  const uniqueTranslations = Array.from(new Set(entries.map((entry) => entry.translation)));

  for (let i = uniqueTranslations.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniqueTranslations[i], uniqueTranslations[j]] = [uniqueTranslations[j], uniqueTranslations[i]];
  }

  return uniqueTranslations.slice(0, count);
}
