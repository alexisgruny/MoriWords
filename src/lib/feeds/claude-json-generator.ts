import { z } from "zod";

// Délai maximum d'attente de la réponse de Claude avant d'abandonner.
const DEFAULT_TIMEOUT_MS = 20_000;

// Messages d'erreur adaptés à chaque source (clé API absente, timeout,
// panne réseau, réponse HTTP en erreur, réponse vide, JSON inexploitable).
type GenerationMessages = {
  missingApiKey: string;
  timeout: string;
  networkError: string;
  httpError: string;
  empty: string;
  invalid: string;
};

type GenerateJsonParams<T> = {
  prompt: string;
  schema: z.ZodType<T>;
  messages: GenerationMessages;
  createError: (message: string) => Error;
  maxTokens?: number;
  timeoutMs?: number;
};

// Extrait l'objet JSON contenu dans la réponse de Claude, même entouré de
// texte ou d'un bloc de code markdown. Renvoie null si rien d'exploitable.
function extractJsonPayload(rawText: string): unknown | null {
  const normalized = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "");

  const startIndex = normalized.indexOf("{");
  const endIndex = normalized.lastIndexOf("}");

  if (startIndex < 0 || endIndex <= startIndex) {
    return null;
  }

  try {
    return JSON.parse(normalized.slice(startIndex, endIndex + 1)) as unknown;
  } catch {
    return null;
  }
}

// Appelle Claude pour générer un contenu structuré en JSON, sans jamais
// scraper de site externe (contourne ainsi les soucis de robots.txt/CGU,
// voir PLAN-MVP.txt Priorite 11). Factorise la logique commune à toutes les
// sources générées (anime-quote, news-summary, daily-dialogue, literary-excerpt) :
// vérification de la clé API, timeout, gestion d'erreur réseau/HTTP, et
// extraction+validation du JSON renvoyé.
export async function generateJsonFromClaude<T>({
  prompt,
  schema,
  messages,
  createError,
  maxTokens = 256,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: GenerateJsonParams<T>): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw createError(messages.missingApiKey);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw createError(messages.timeout);
    }

    console.error("Anthropic generation request failed:", fetchError);
    throw createError(messages.networkError);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error(`Anthropic generation API error (${response.status}):`, errorPayload || response.statusText);
    throw createError(messages.httpError);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const rawText = payload.content?.find((entry) => entry.type === "text")?.text;

  if (!rawText) {
    throw createError(messages.empty);
  }

  const jsonPayload = extractJsonPayload(rawText);
  const result = jsonPayload === null ? null : schema.safeParse(jsonPayload);

  if (!result || !result.success) {
    console.error("Anthropic generation response had no exploitable content:", rawText);
    throw createError(messages.invalid);
  }

  return result.data;
}
