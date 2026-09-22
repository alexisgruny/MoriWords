import { z } from "zod";

// Délai maximum d'attente de la réponse de Claude avant d'abandonner.
const QUOTE_TIMEOUT_MS = 20_000;

// Une citation générée : le texte japonais, son origine et le personnage (si connu).
export type AnimeQuote = {
  content: string;
  source: string;
  character: string | null;
};

// Forme attendue du JSON renvoyé par Claude.
const quotePayloadSchema = z.object({
  quote: z.string().min(1),
  source: z.string().min(1),
  character: z.string().nullable().optional(),
});

// Erreur levée quand la génération de citation échoue, avec un message
// compréhensible pour l'utilisateur (jamais le détail technique brut).
export class QuoteServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteServiceError";
  }
}

// Extrait et valide l'objet JSON contenu dans la réponse de Claude, même si
// elle est entourée de texte ou d'un bloc de code markdown. Renvoie null si
// rien d'exploitable n'est trouvé.
function extractQuotePayload(rawText: string): AnimeQuote | null {
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
    const parsed = JSON.parse(normalized.slice(startIndex, endIndex + 1)) as unknown;
    const result = quotePayloadSchema.safeParse(parsed);

    if (!result.success) {
      return null;
    }

    return {
      content: result.data.quote,
      source: result.data.source,
      character: result.data.character ?? null,
    };
  } catch {
    return null;
  }
}

// Demande à Claude une citation japonaise célèbre tirée d'un anime, film ou
// série. Contourne complètement le scraping de site web (et les problèmes de
// robots.txt/CGU qui vont avec, voir PLAN-MVP.txt Priorite 11) : rien n'est
// récupéré sur un site externe, seul Claude est appelé. La liste
// recentQuotes permet d'éviter de répéter les citations déjà utilisées.
export async function generateAnimeQuote(recentQuotes: string[] = []): Promise<AnimeQuote> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new QuoteServiceError("La clé API Anthropic n'est pas configurée.");
  }

  // Construit la liste des citations à éviter, à inclure dans le prompt.
  const exclusionText = recentQuotes.length > 0
    ? `\n\nN'utilise aucune de ces citations déjà utilisées récemment :\n${recentQuotes.map((quote) => `- ${quote}`).join("\n")}`
    : "";

  // Prépare l'annulation automatique de la requête si elle prend trop de temps.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), QUOTE_TIMEOUT_MS);

  let response: Response;

  try {
    // Appelle l'API Anthropic avec le prompt de génération de citation.
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
            content: `Donne une citation japonaise courte, célèbre et facilement vérifiable, tirée d'un anime, film ou série japonaise très connu. Privilégie les répliques iconiques et largement documentées pour éviter toute approximation ou invention. Réponds uniquement en JSON avec la structure suivante : {"quote":"...texte original en japonais...","source":"Titre de l'œuvre (année)","character":"nom du personnage ou null"}.${exclusionText}`,
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (fetchError) {
    // Distingue un simple délai dépassé d'une vraie panne réseau.
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new QuoteServiceError("La génération de citation met trop de temps à répondre.");
    }

    console.error("Anthropic quote request failed:", fetchError);
    throw new QuoteServiceError("Le service de citation est injoignable pour le moment.");
  } finally {
    // Annule le minuteur d'annulation, que la requête ait réussi ou échoué.
    clearTimeout(timeoutId);
  }

  // Si Anthropic répond avec une erreur, on logue le détail côté serveur et
  // on renvoie un message générique côté client (jamais le détail brut).
  if (!response.ok) {
    const errorPayload = await response.text();
    console.error(`Anthropic quote API error (${response.status}):`, errorPayload || response.statusText);
    throw new QuoteServiceError("Le service de citation est momentanément indisponible.");
  }

  // Extrait le texte de la réponse (Anthropic renvoie plusieurs blocs de contenu).
  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const rawText = payload.content?.find((entry) => entry.type === "text")?.text;

  if (!rawText) {
    throw new QuoteServiceError("Réponse de citation vide.");
  }

  const quote = extractQuotePayload(rawText);

  if (!quote) {
    console.error("Anthropic quote response had no exploitable content:", rawText);
    throw new QuoteServiceError("Le service de citation n'a pas renvoyé de résultat exploitable.");
  }

  return quote;
}
