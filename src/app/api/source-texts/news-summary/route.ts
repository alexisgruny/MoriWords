import { prisma } from "@/lib/db/prisma";
import { NewsSummaryServiceError, generateNewsSummary } from "@/lib/feeds/news-summary";

// Génère un court paragraphe d'actualité simplifiée via Claude et
// l'enregistre comme nouveau texte source, prêt à être analysé comme
// n'importe quel autre texte.
export async function POST() {
  try {
    // Récupère les sujets récents pour éviter que Claude se répète.
    const recentTexts = await prisma.sourceText.findMany({
      where: { origin: "news-summary" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { title: true },
    });

    const summary = await generateNewsSummary(
      recentTexts.map((entry) => entry.title).filter((title): title is string => Boolean(title)),
    );

    const sourceText = await prisma.sourceText.create({
      data: {
        content: summary.content,
        title: summary.topic,
        origin: "news-summary",
        category: "news",
        sourceLanguage: "ja",
        targetLanguage: "fr",
      },
    });

    return Response.json({ sourceText }, { status: 201 });
  } catch (error) {
    if (error instanceof NewsSummaryServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to generate news summary:", error);
    return Response.json(
      { error: "Impossible de générer une actualité pour le moment." },
      { status: 500 },
    );
  }
}
