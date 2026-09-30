import { requireUser } from "@/lib/auth/session";
import { getExamStatuses, isExamLevel, startExam } from "@/lib/exams/attempts";
import { limitUserWrites } from "@/lib/security/rate-limit";

// État des paliers du compte : réussis, meilleur score, délai avant de repasser.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    return Response.json({ levels: await getExamStatuses(user.id) });
  } catch (error) {
    console.error("Failed to load exam statuses:", error);
    return Response.json({ error: "Impossible de charger tes paliers." }, { status: 500 });
  }
}

// Commence (ou reprend) l'examen d'un palier.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  const writesLimited = await limitUserWrites(user.id);
  if (writesLimited) {
    return writesLimited;
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const level = typeof body === "object" && body !== null ? (body as Record<string, unknown>).level : null;
    if (!isExamLevel(level)) {
      return Response.json({ error: "Palier inconnu." }, { status: 400 });
    }

    const result = await startExam(user.id, level);
    if (!result.ok) {
      return Response.json({ error: "Tu pourras repasser ce palier un peu plus tard.", retryAt: result.retryAt }, { status: 429 });
    }
    return Response.json({ attemptId: result.attemptId, questions: result.questions }, { status: 201 });
  } catch (error) {
    console.error("Failed to start exam:", error);
    return Response.json({ error: "Impossible de lancer l'examen." }, { status: 500 });
  }
}
