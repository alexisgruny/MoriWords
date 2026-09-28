import { getExerciseStats } from "@/lib/grammar/exercise-stats";

// Statistiques de progression sur les exercices : taux de réussite par
// source (grammaire/conjugaison/kanji/mon vocabulaire) et les points les
// plus ratés, pour la page /exercices/stats.
export async function GET() {
  try {
    const stats = await getExerciseStats();
    return Response.json(stats);
  } catch (error) {
    console.error("Failed to load exercise stats:", error);
    return Response.json({ error: "Impossible de charger les statistiques." }, { status: 500 });
  }
}
