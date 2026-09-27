import { ExerciseServiceError, pickExampleExercise, pickGrammarExercise } from "@/lib/grammar/exercises";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";

// La première phrase d'un point de grammaire peut déclencher une génération Claude.
export const maxDuration = 60;

// Propose une phrase française à traduire en japonais. source "grammar" : phrases
// liées aux points de grammaire (du niveau choisi) ; source "examples" : phrases
// d'exemple des mots sauvegardés dans les decks. excludeIds évite de reproposer
// les phrases déjà faites pendant la session.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const candidate = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

    const source = candidate.source === "examples" ? "examples" : "grammar";
    const level = GRAMMAR_LEVELS.includes(candidate.level as GrammarLevel)
      ? (candidate.level as GrammarLevel)
      : "all";
    const excludeIds = Array.isArray(candidate.excludeIds)
      ? candidate.excludeIds.filter((id): id is string => typeof id === "string")
      : [];

    const exercise =
      source === "examples"
        ? await pickExampleExercise(excludeIds)
        : await pickGrammarExercise(level, excludeIds);

    if (!exercise) {
      return Response.json({
        exercise: null,
        message:
          source === "examples"
            ? "Aucune phrase d'exemple disponible : ajoute des mots à un deck pour en générer."
            : "Tu as fait toutes les phrases disponibles pour ce niveau. Change de niveau pour continuer.",
      });
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
