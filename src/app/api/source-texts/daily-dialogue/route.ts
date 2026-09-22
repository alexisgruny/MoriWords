import { prisma } from "@/lib/db/prisma";
import { DialogueServiceError, generateDailyDialogue } from "@/lib/feeds/daily-dialogue";

// Génère un court dialogue de la vie quotidienne via Claude et l'enregistre
// comme nouveau texte source, prêt à être analysé comme n'importe quel
// autre texte.
export async function POST() {
  try {
    // Récupère les scènes récentes pour éviter que Claude se répète.
    const recentTexts = await prisma.sourceText.findMany({
      where: { origin: "daily-dialogue" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { title: true },
    });

    const dialogue = await generateDailyDialogue(
      recentTexts.map((entry) => entry.title).filter((title): title is string => Boolean(title)),
    );

    const sourceText = await prisma.sourceText.create({
      data: {
        content: dialogue.content,
        title: dialogue.scene,
        origin: "daily-dialogue",
        category: "dialogue",
        sourceLanguage: "ja",
        targetLanguage: "fr",
      },
    });

    return Response.json({ sourceText }, { status: 201 });
  } catch (error) {
    if (error instanceof DialogueServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to generate daily dialogue:", error);
    return Response.json(
      { error: "Impossible de générer un dialogue pour le moment." },
      { status: 500 },
    );
  }
}
