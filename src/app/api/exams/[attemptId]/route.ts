import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { submitExam } from "@/lib/exams/attempts";
import { limitUserWrites } from "@/lib/security/rate-limit";

// -1 : question sans réponse. 60 réponses au plus (un examen en a 40).
const submitSchema = z.object({ answers: z.array(z.number().int().min(-1).max(3)).max(60) });

// Rend l'examen : correction côté serveur, bonnes réponses renvoyées ensuite.
export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  const writesLimited = await limitUserWrites(user.id);
  if (writesLimited) {
    return writesLimited;
  }

  try {
    const parsed = submitSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "Réponses invalides." }, { status: 400 });
    }

    const { attemptId } = await params;
    const result = await submitExam(user.id, attemptId, parsed.data.answers);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json(result);
  } catch (error) {
    console.error("Failed to submit exam:", error);
    return Response.json({ error: "Impossible de corriger l'examen." }, { status: 500 });
  }
}
