import { requireUser } from "@/lib/auth/session";
import { setClaudeContext } from "@/lib/security/claude-usage";
import { limitByIp } from "@/lib/security/rate-limit";
import {
  ExerciseServiceError,
  MAX_ANSWER_LENGTH,
  correctKanjiMeaningAnswer,
  getTranslationCorrection,
  isKanjiExerciseId,
  logExerciseAttempt,
  resolveExercise,
} from "@/lib/grammar/exercises";

export const maxDuration = 60;

// Corrige la traduction japonaise envoyée par l'élève pour un exercice et
// renvoie la correction expliquée, avec la traduction de référence.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  setClaudeContext({ userId: user.id, action: "correction" });

  const limited = await limitByIp(request, "claude");
  if (limited) {
    return limited;
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const candidate = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

    const exerciseId = typeof candidate.exerciseId === "string" ? candidate.exerciseId : "";
    const answer = typeof candidate.answer === "string" ? candidate.answer.trim() : "";

    if (!exerciseId) {
      return Response.json({ error: "L'exercice est requis." }, { status: 400 });
    }

    if (!answer) {
      return Response.json({ error: "Écris ta traduction avant de l'envoyer." }, { status: 400 });
    }

    if (answer.length > MAX_ANSWER_LENGTH) {
      return Response.json(
        { error: `La réponse est trop longue (${MAX_ANSWER_LENGTH} caractères maximum).` },
        { status: 400 },
      );
    }

    const exercise = await resolveExercise(exerciseId, user.id);

    if (!exercise) {
      return Response.json({ error: "Exercice introuvable." }, { status: 404 });
    }

    const correction = isKanjiExerciseId(exerciseId)
      ? correctKanjiMeaningAnswer({ reference: exercise.japanese, answer })
      : await getTranslationCorrection({
          exerciseId,
          french: exercise.french,
          reference: exercise.japanese,
          focus: exercise.focus,
          answer,
        });

    await logExerciseAttempt({
      userId: user.id,
      exerciseId,
      focus: exercise.focus,
      level: exercise.level,
      correct: correction.verdict === "correct",
    });

    return Response.json({ correction, reference: exercise.japanese });
  } catch (error) {
    if (error instanceof ExerciseServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to correct a translation:", error);
    return Response.json({ error: "Impossible de corriger cette traduction." }, { status: 500 });
  }
}
