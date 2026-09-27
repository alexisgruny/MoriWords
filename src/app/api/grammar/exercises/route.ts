import {
  ExerciseServiceError,
  pickConjugationExercise,
  pickExampleExercise,
  pickGrammarExercise,
} from "@/lib/grammar/exercises";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";

// La première phrase d'un point de grammaire peut déclencher une génération Claude.
export const maxDuration = 60;

type Source = "grammar" | "examples" | "conjugation";

// Propose une phrase française à traduire en japonais. source "grammar" : phrases
// liées aux points de grammaire (du niveau choisi) ; "examples" : phrases
// d'exemple des mots sauvegardés dans les decks ; "conjugation" : exemples du
// référentiel de conjugaison (src/lib/conjugation/forms.ts). excludeIds évite
// de reproposer les phrases déjà faites pendant la session.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const candidate = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

    const source: Source =
      candidate.source === "examples" || candidate.source === "conjugation" ? candidate.source : "grammar";
    const level = GRAMMAR_LEVELS.includes(candidate.level as GrammarLevel)
      ? (candidate.level as GrammarLevel)
      : "all";
    const excludeIds = Array.isArray(candidate.excludeIds)
      ? candidate.excludeIds.filter((id): id is string => typeof id === "string")
      : [];

    const exercise = await (source === "examples"
      ? pickExampleExercise(level, excludeIds)
      : source === "conjugation"
        ? pickConjugationExercise(level, excludeIds)
        : pickGrammarExercise(level, excludeIds));

    if (!exercise) {
      const messages: Record<Source, string> = {
        examples:
          level === "all"
            ? "Aucune phrase d'exemple disponible : ajoute des mots à un deck pour en générer."
            : `Aucune phrase d'exemple de niveau ${level} disponible. Essaie un autre niveau ou ajoute des mots de ce niveau à un deck.`,
        conjugation: "Tu as fait toutes les phrases disponibles pour ce niveau. Change de niveau pour continuer.",
        grammar: "Tu as fait toutes les phrases disponibles pour ce niveau. Change de niveau pour continuer.",
      };

      return Response.json({ exercise: null, message: messages[source] });
    }

    return Response.json({ exercise });
  } catch (error) {
    if (error instanceof ExerciseServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to pick a grammar exercise:", error);
    return Response.json({ error: "Impossible de charger un exercice." }, { status: 500 });
  }
}
