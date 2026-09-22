import { prisma } from "@/lib/db/prisma";
import { LiteraryExcerptServiceError, generateLiteraryExcerpt } from "@/lib/feeds/literary-excerpt";

// Génère un court extrait littéraire pastiche via Claude et l'enregistre
// comme nouveau texte source, prêt à être analysé comme n'importe quel
// autre texte.
export async function POST() {
  try {
    // Récupère les styles récents pour éviter que Claude se répète.
    const recentTexts = await prisma.sourceText.findMany({
      where: { origin: "literary-excerpt" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { title: true },
    });

    const excerpt = await generateLiteraryExcerpt(
      recentTexts.map((entry) => entry.title).filter((title): title is string => Boolean(title)),
    );

    const sourceText = await prisma.sourceText.create({
      data: {
        content: excerpt.content,
        title: excerpt.styleReference,
        origin: "literary-excerpt",
        category: "literature",
        sourceLanguage: "ja",
        targetLanguage: "fr",
      },
    });

    return Response.json({ sourceText }, { status: 201 });
  } catch (error) {
    if (error instanceof LiteraryExcerptServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to generate literary excerpt:", error);
    return Response.json(
      { error: "Impossible de générer un extrait pour le moment." },
      { status: 500 },
    );
  }
}
