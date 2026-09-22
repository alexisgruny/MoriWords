import { z } from "zod";

import { generateJsonFromClaude } from "./claude-json-generator";

// Un court paragraphe d'actualité simplifiée : le texte japonais et le sujet abordé.
export type NewsSummary = {
  content: string;
  topic: string;
};

// Forme attendue du JSON renvoyé par Claude.
const newsPayloadSchema = z.object({
  text: z.string().min(1),
  topic: z.string().min(1),
});

// Erreur levée quand la génération d'actualité échoue, avec un message
// compréhensible pour l'utilisateur (jamais le détail technique brut).
export class NewsSummaryServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsSummaryServiceError";
  }
}

// Demande à Claude un court paragraphe de style "NHK Easy News" (japonais
// simplifié) sur un sujet général et intemporel (technologie, culture,
// société, environnement...). Contourne complètement le scraping de site
// web : NHK n'a pas de flux RSS officiel et son robots.txt bloque les
// crawlers IA (voir PLAN-MVP.txt Priorite 11), donc rien n'est récupéré sur
// un site externe, seul Claude est appelé. Le prompt évite explicitement
// toute actualité datée ou chiffrée qui serait présentée comme réelle, pour
// ne pas risquer de générer de la désinformation. recentTopics permet
// d'éviter de répéter les mêmes sujets.
export async function generateNewsSummary(recentTopics: string[] = []): Promise<NewsSummary> {
  const exclusionText = recentTopics.length > 0
    ? `\n\nN'utilise aucun de ces sujets déjà utilisés récemment :\n${recentTopics.map((topic) => `- ${topic}`).join("\n")}`
    : "";

  const payload = await generateJsonFromClaude({
    prompt: `Écris un court paragraphe en japonais simplifié, dans le style "NHK Easy News" (grammaire simple, vocabulaire accessible à un niveau intermédiaire), sur un sujet général et intemporel lié au Japon (culture, technologie, société, environnement, vie quotidienne). N'invente aucun événement précis, date, statistique ou fait qui pourrait être pris pour une vraie information d'actualité : reste sur du contenu explicatif et général. Réponds uniquement en JSON avec la structure suivante : {"text":"...paragraphe en japonais...","topic":"sujet en quelques mots"}.${exclusionText}`,
    schema: newsPayloadSchema,
    maxTokens: 400,
    createError: (message) => new NewsSummaryServiceError(message),
    messages: {
      missingApiKey: "La clé API Anthropic n'est pas configurée.",
      timeout: "La génération d'actualité met trop de temps à répondre.",
      networkError: "Le service d'actualité est injoignable pour le moment.",
      httpError: "Le service d'actualité est momentanément indisponible.",
      empty: "Réponse d'actualité vide.",
      invalid: "Le service d'actualité n'a pas renvoyé de résultat exploitable.",
    },
  });

  return {
    content: payload.text,
    topic: payload.topic,
  };
}
