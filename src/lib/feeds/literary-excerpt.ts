import { z } from "zod";

import { generateJsonFromClaude } from "./claude-json-generator";

// Un extrait littéraire pastiche : le texte japonais et le style de référence.
export type LiteraryExcerpt = {
  content: string;
  styleReference: string;
};

// Forme attendue du JSON renvoyé par Claude.
const excerptPayloadSchema = z.object({
  text: z.string().min(1),
  styleReference: z.string().min(1),
});

// Erreur levée quand la génération d'extrait échoue, avec un message
// compréhensible pour l'utilisateur (jamais le détail technique brut).
export class LiteraryExcerptServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiteraryExcerptServiceError";
  }
}

// Demande à Claude un court extrait ORIGINAL écrit dans le style d'un
// auteur japonais du domaine public (ex. Natsume Sōseki, Akutagawa
// Ryūnosuke), pour du vocabulaire plus soutenu/littéraire. Il s'agit d'un
// pastiche explicitement présenté comme tel, jamais d'une citation exacte
// prétendue d'une œuvre réelle (Claude pourrait se tromper de mot pour mot,
// ce qui induirait en erreur). Contourne complètement le scraping de site
// web (voir PLAN-MVP.txt Priorite 11) : rien n'est récupéré sur un site
// externe, seul Claude est appelé. recentStyles permet de varier les
// auteurs/styles utilisés.
export async function generateLiteraryExcerpt(recentStyles: string[] = []): Promise<LiteraryExcerpt> {
  const exclusionText = recentStyles.length > 0
    ? `\n\nN'utilise aucun de ces styles/auteurs déjà utilisés récemment :\n${recentStyles.map((style) => `- ${style}`).join("\n")}`
    : "";

  const payload = await generateJsonFromClaude({
    prompt: `Écris un court paragraphe ORIGINAL en japonais (pas une citation réelle, un pastiche que tu inventes), inspiré du style d'écriture d'un auteur japonais classique du domaine public (par exemple Natsume Sōseki, Akutagawa Ryūnosuke, Miyazawa Kenji). Indique clairement dans ta réponse qu'il s'agit d'un pastiche et non d'une citation exacte. Réponds uniquement en JSON avec la structure suivante : {"text":"...paragraphe original en japonais...","styleReference":"Style de : Nom de l'auteur"}.${exclusionText}`,
    schema: excerptPayloadSchema,
    maxTokens: 500,
    createError: (message) => new LiteraryExcerptServiceError(message),
    messages: {
      missingApiKey: "La clé API Anthropic n'est pas configurée.",
      timeout: "La génération d'extrait met trop de temps à répondre.",
      networkError: "Le service d'extrait est injoignable pour le moment.",
      httpError: "Le service d'extrait est momentanément indisponible.",
      empty: "Réponse d'extrait vide.",
      invalid: "Le service d'extrait n'a pas renvoyé de résultat exploitable.",
    },
  });

  return {
    content: payload.text,
    styleReference: payload.styleReference,
  };
}
