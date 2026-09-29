import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { KANA } from "@/lib/kana/kana";

const KNOWN_KANA = new Set(KANA.map((entry) => entry.kana));

// Enregistre une réponse au quiz de kana, corrigé dans le navigateur (aucun
// appel à Claude) : seule la trace pour les statistiques passe par ici.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const candidate = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

    if (typeof candidate.kana !== "string" || !KNOWN_KANA.has(candidate.kana) || typeof candidate.correct !== "boolean") {
      return Response.json({ error: "Réponse invalide." }, { status: 400 });
    }

    await prisma.exerciseAttempt.create({
      data: { userId: user.id, source: "kana", focus: candidate.kana, level: null, correct: candidate.correct },
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to record kana attempt:", error);
    return Response.json({ error: "Impossible d'enregistrer la réponse." }, { status: 500 });
  }
}
