import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { KANA } from "@/lib/kana/kana";
import { JLPT_KANJI } from "@/lib/kanji/kanji";

const KNOWN_KANA = new Set(KANA.map((entry) => entry.kana));
const KANJI_LEVELS = new Map(JLPT_KANJI.map((entry) => [entry.kanji, entry.level]));

// Exercices corrigés dans le navigateur (aucun appel à Claude) : lecture de
// kana, écriture de kana et de kanji. Seule la trace pour les statistiques et
// les couleurs des pages de référence passe par ici.
const SOURCES = {
  kana: (focus: string) => (KNOWN_KANA.has(focus) ? { level: null } : null),
  "kana-writing": (focus: string) => (KNOWN_KANA.has(focus) ? { level: null } : null),
  "kanji-writing": (focus: string) => (KANJI_LEVELS.has(focus) ? { level: KANJI_LEVELS.get(focus)! } : null),
} as const;

type LocalSource = keyof typeof SOURCES;

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const candidate = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const source = candidate.source as LocalSource;
    const known =
      typeof candidate.focus === "string" && Object.hasOwn(SOURCES, source) ? SOURCES[source](candidate.focus) : null;

    if (!known || typeof candidate.correct !== "boolean") {
      return Response.json({ error: "Réponse invalide." }, { status: 400 });
    }

    await prisma.exerciseAttempt.create({
      data: {
        userId: user.id,
        source,
        focus: candidate.focus as string,
        level: known.level,
        correct: candidate.correct,
      },
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to record local exercise attempt:", error);
    return Response.json({ error: "Impossible d'enregistrer la réponse." }, { status: 500 });
  }
}
