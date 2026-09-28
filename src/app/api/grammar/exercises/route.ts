import {
  ExerciseServiceError,
  pickConjugationExercise,
  pickExampleExercise,
  pickGrammarExercise,
  pickKanjiExercise,
} from "@/lib/grammar/exercises";
import { GRAMMAR_LEVELS, type GrammarLevel } from "@/lib/grammar/points";

// La première phrase d'un point de grammaire peut déclencher une génération Claude.
export const maxDuration = 60;

type Source = "grammar" | "examples" | "conjugation" | "kanji";

const SOURCES: Source[] = ["examples", "conjugation", "kanji"];

// Propose une phrase française à traduire en japonais. source "grammar" : phrases
// liées aux points de grammaire (du niveau choisi) ; "examples" : phrases
// d'exemple des mots sauvegardés dans les decks ; "conjugation" : exemples du
// référentiel de conjugaison (src/lib/conjugation/forms.ts) ; "kanji" : sens
// d'un kanji du référentiel (src/lib/kanji/kanji.ts), l'élève doit écrire le
// caractère. excludeIds évite de reproposer les phrases déjà faites pendant
// la session. focusIn (optionnel) restreint aux points/formes/kanji/mots
// listés (voir /exercices/revision, qui s'entraîne sur les points faibles
// remontés par les statistiques).
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const candidate = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

    const source: Source = SOURCES.includes(candidate.source as Source) ? (candidate.source as Source) : "grammar";
    const level = GRAMMAR_LEVELS.includes(candidate.level as GrammarLevel)
      ? (candidate.level as GrammarLevel)
      : "all";
    const excludeIds = Array.isArray(candidate.excludeIds)
      ? candidate.excludeIds.filter((id): id is string => typeof id === "string")
      : [];
    const focusIn = Array.isArray(candidate.focusIn)
      ? candidate.focusIn.filter((focus): focus is string => typeof focus === "string")
      : undefined;

    const pickers: Record<Source, () => Promise<Awaited<ReturnType<typeof pickGrammarExercise>>>> = {
      grammar: () => pickGrammarExercise(level, excludeIds, undefined, focusIn),
      examples: () => pickExampleExercise(level, excludeIds, focusIn),
      conjugation: () => pickConjugationExercise(level, excludeIds, focusIn),
      kanji: () => pickKanjiExercise(level, excludeIds, focusIn),
    };

    const exercise = await pickers[source]();

    if (!exercise) {
      const messages: Record<Source, string> = {
        examples:
          level === "all"
            ? "Aucune phrase d'exemple disponible : ajoute des mots à un deck pour en générer."
            : `Aucune phrase d'exemple de niveau ${level} disponible. Essaie un autre niveau ou ajoute des mots de ce niveau à un deck.`,
        conjugation: "Tu as fait toutes les phrases disponibles pour ce niveau. Change de niveau pour continuer.",
        kanji: "Tu as fait tous les kanji disponibles pour ce niveau. Change de niveau pour continuer.",
        grammar: "Tu as fait toutes les phrases disponibles pour ce niveau. Change de niveau pour continuer.",
      };

      const message =
        focusIn && focusIn.length > 0
          ? "Tu as fait tous les exercices disponibles pour ces points faibles. Continue à t'entraîner ailleurs, les statistiques se mettent à jour à chaque réponse."
          : messages[source];

      return Response.json({ exercise: null, message });
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
