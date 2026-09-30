import { requireUser } from "@/lib/auth/session";
import { LESSON_IDS } from "@/lib/course/lessons";
import { prisma } from "@/lib/db/prisma";
import { limitUserWrites } from "@/lib/security/rate-limit";

// Leçons validées du parcours débutant par le compte connecté. finished :
// toutes les leçons validées, ou palier N5 réussi (déjà à l'aise) ; le menu
// cache alors le parcours.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const [rows, passedN5] = await Promise.all([
      prisma.lessonProgress.findMany({ where: { userId: user.id }, select: { lessonId: true } }),
      prisma.examAttempt.count({ where: { userId: user.id, level: "N5", passed: true } }),
    ]);
    const completed = rows.map((row) => row.lessonId);
    const finished = passedN5 > 0 || [...LESSON_IDS].every((lessonId) => completed.includes(lessonId));
    return Response.json({ completed, finished });
  } catch (error) {
    console.error("Failed to load course progress:", error);
    return Response.json({ error: "Impossible de charger ta progression." }, { status: 500 });
  }
}

// Valide une leçon (idempotent : la revalider ne change rien).
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
    const lessonId = typeof body === "object" && body !== null ? (body as Record<string, unknown>).lessonId : null;

    if (typeof lessonId !== "string" || !LESSON_IDS.has(lessonId)) {
      return Response.json({ error: "Leçon inconnue." }, { status: 400 });
    }

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId },
      update: {},
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to save lesson progress:", error);
    return Response.json({ error: "Impossible d'enregistrer la leçon." }, { status: 500 });
  }
}
