import { prisma } from "@/lib/db/prisma";
import { QuoteServiceError, generateAnimeQuote } from "@/lib/feeds/anime-quote";

// Génère une citation d'anime via Claude et l'enregistre comme nouveau
// texte source, prêt à être analysé comme n'importe quel autre texte.
export async function POST() {
  try {
    // Récupère les citations récentes pour éviter que Claude se répète.
    const recentQuotes = await prisma.sourceText.findMany({
      where: { origin: "anime-quote" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { content: true },
    });

    const quote = await generateAnimeQuote(recentQuotes.map((entry) => entry.content));

    const sourceText = await prisma.sourceText.create({
      data: {
        content: quote.content,
        title: quote.character ? `${quote.source} — ${quote.character}` : quote.source,
        origin: "anime-quote",
        category: "anime",
        sourceLanguage: "ja",
        targetLanguage: "fr",
      },
    });

    return Response.json({ sourceText }, { status: 201 });
  } catch (error) {
    if (error instanceof QuoteServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to generate anime quote:", error);
    return Response.json(
      { error: "Impossible de générer une citation pour le moment." },
      { status: 500 },
    );
  }
}
