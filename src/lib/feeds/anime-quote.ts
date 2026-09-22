import { z } from "zod";

import { generateJsonFromClaude } from "./claude-json-generator";

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

// Demande à Claude une citation japonaise célèbre tirée d'un anime, film ou
// série. Contourne complètement le scraping de site web (et les problèmes de
// robots.txt/CGU qui vont avec, voir PLAN-MVP.txt Priorite 11) : rien n'est
// récupéré sur un site externe, seul Claude est appelé. La liste
// recentQuotes permet d'éviter de répéter les citations déjà utilisées.
export async function generateAnimeQuote(recentQuotes: string[] = []): Promise<AnimeQuote> {
  // Construit la liste des citations à éviter, à inclure dans le prompt.
  const exclusionText = recentQuotes.length > 0
    ? `\n\nN'utilise aucune de ces citations déjà utilisées récemment :\n${recentQuotes.map((quote) => `- ${quote}`).join("\n")}`
    : "";

  const payload = await generateJsonFromClaude({
    prompt: `Donne une citation japonaise courte, célèbre et facilement vérifiable, tirée d'un anime, film ou série japonaise très connu. Privilégie les répliques iconiques et largement documentées pour éviter toute approximation ou invention. Réponds uniquement en JSON avec la structure suivante : {"quote":"...texte original en japonais...","source":"Titre de l'œuvre (année)","character":"nom du personnage ou null"}.${exclusionText}`,
    schema: quotePayloadSchema,
    createError: (message) => new QuoteServiceError(message),
    messages: {
      missingApiKey: "La clé API Anthropic n'est pas configurée.",
      timeout: "La génération de citation met trop de temps à répondre.",
      networkError: "Le service de citation est injoignable pour le moment.",
      httpError: "Le service de citation est momentanément indisponible.",
      empty: "Réponse de citation vide.",
      invalid: "Le service de citation n'a pas renvoyé de résultat exploitable.",
    },
  });

  return {
    content: payload.quote,
    source: payload.source,
    character: payload.character ?? null,
  };
}
