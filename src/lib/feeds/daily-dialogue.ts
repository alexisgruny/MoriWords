import { z } from "zod";

import { generateJsonFromClaude } from "./claude-json-generator";

// Un mini-dialogue de la vie quotidienne : le texte japonais et la scène concernée.
export type DailyDialogue = {
  content: string;
  scene: string;
};

// Forme attendue du JSON renvoyé par Claude.
const dialoguePayloadSchema = z.object({
  dialogue: z.string().min(1),
  scene: z.string().min(1),
});

// Erreur levée quand la génération de dialogue échoue, avec un message
// compréhensible pour l'utilisateur (jamais le détail technique brut).
export class DialogueServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DialogueServiceError";
  }
}

// Demande à Claude un court dialogue naturel de la vie quotidienne (au
// restaurant, dans un magasin, au travail, à la gare...), pour du
// vocabulaire pratique/conversationnel. Contourne complètement le scraping
// de site web (voir PLAN-MVP.txt Priorite 11) : rien n'est récupéré sur un
// site externe, seul Claude est appelé. recentScenes permet d'éviter de
// répéter les mêmes situations.
export async function generateDailyDialogue(recentScenes: string[] = []): Promise<DailyDialogue> {
  const exclusionText = recentScenes.length > 0
    ? `\n\nN'utilise aucune de ces scènes déjà utilisées récemment :\n${recentScenes.map((scene) => `- ${scene}`).join("\n")}`
    : "";

  const payload = await generateJsonFromClaude({
    prompt: `Écris un court dialogue naturel en japonais (3 à 5 échanges) entre deux personnes, dans une situation de la vie quotidienne au Japon (restaurant, magasin, travail, gare, chez le médecin, etc.). Indique chaque réplique sur une nouvelle ligne, précédée du nom du locuteur suivi de "：" (par exemple "店員：..."). Réponds uniquement en JSON avec la structure suivante : {"dialogue":"...dialogue complet en japonais avec retours à la ligne...","scene":"description courte de la scène"}.${exclusionText}`,
    schema: dialoguePayloadSchema,
    maxTokens: 500,
    createError: (message) => new DialogueServiceError(message),
    messages: {
      missingApiKey: "La clé API Anthropic n'est pas configurée.",
      timeout: "La génération de dialogue met trop de temps à répondre.",
      networkError: "Le service de dialogue est injoignable pour le moment.",
      httpError: "Le service de dialogue est momentanément indisponible.",
      empty: "Réponse de dialogue vide.",
      invalid: "Le service de dialogue n'a pas renvoyé de résultat exploitable.",
    },
  });

  return {
    content: payload.dialogue,
    scene: payload.scene,
  };
}
