import { isAdminEmail } from "@/lib/admin/usage-stats";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/auth/account";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// Droit d'accès et de portabilité (RGPD) : toutes les données du compte en
// un fichier JSON téléchargeable.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const [account, decks, sourceTexts, vocabulary, exerciseAttempts, lessonProgress, examAttempts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true, createdAt: true, hideCourse: true, accounts: { select: { providerId: true } } },
      }),
      prisma.deck.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: {
          name: true,
          description: true,
          createdAt: true,
          cards: {
            orderBy: { createdAt: "asc" },
            select: {
              lemma: true,
              surface: true,
              reading: true,
              meaning: true,
              repetitions: true,
              interval: true,
              easeFactor: true,
              dueAt: true,
              createdAt: true,
              examples: { orderBy: { position: "asc" }, select: { japanese: true, reading: true, translation: true } },
              reviewLogs: { orderBy: { reviewedAt: "asc" }, select: { quality: true, reviewedAt: true } },
            },
          },
        },
      }),
      prisma.sourceText.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { title: true, content: true, origin: true, sourceUrl: true, createdAt: true },
      }),
      prisma.vocabularyEntry.findMany({
        where: { userId: user.id },
        orderBy: { occurrenceCount: "desc" },
        select: { lemma: true, reading: true, partOfSpeech: true, occurrenceCount: true },
      }),
      prisma.exerciseAttempt.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { source: true, focus: true, level: true, correct: true, createdAt: true },
      }),
      prisma.lessonProgress.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: "asc" },
        select: { lessonId: true, completedAt: true },
      }),
      prisma.examAttempt.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: "asc" },
        select: { level: true, startedAt: true, finishedAt: true, score: true, total: true, passed: true, results: true },
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      account: account && {
        name: account.name,
        email: account.email,
        createdAt: account.createdAt,
        hideCourse: account.hideCourse,
        signInMethods: account.accounts.map((entry) => entry.providerId),
      },
      decks,
      sourceTexts,
      vocabulary,
      exerciseAttempts,
      lessonProgress,
      examAttempts,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="moriwords-mes-donnees.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export account data:", error);
    return Response.json({ error: "Impossible d'exporter tes données." }, { status: 500 });
  }
}

// Droit à l'effacement : supprime le compte et, en cascade, ses sessions,
// decks, cartes, révisions, textes, vocabulaire et tentatives d'exercice.
// Le suivi des coûts Claude garde ses lignes, détachées du compte.
export async function DELETE(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const confirmation =
      typeof body === "object" && body !== null && "confirmation" in body ? body.confirmation : null;

    if (confirmation !== DELETE_ACCOUNT_CONFIRMATION) {
      return Response.json(
        { error: `Tape ${DELETE_ACCOUNT_CONFIRMATION} pour confirmer la suppression.` },
        { status: 400 },
      );
    }

    // Le compte propriétaire ne se supprime pas d'ici : les emails n'étant
    // pas vérifiés, l'adresse OWNER_EMAIL libérée pourrait être réinscrite
    // par quelqu'un d'autre, qui obtiendrait alors l'accès à /admin.
    if (isAdminEmail(user.email)) {
      return Response.json(
        { error: "Le compte propriétaire du site ne peut pas être supprimé depuis cette page." },
        { status: 403 },
      );
    }

    await prisma.user.delete({ where: { id: user.id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete account:", error);
    return Response.json({ error: "Impossible de supprimer le compte." }, { status: 500 });
  }
}
