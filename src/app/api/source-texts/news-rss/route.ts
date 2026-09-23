import { NewsRssServiceError, ingestNextNewsArticle } from "@/lib/feeds/news-rss";

// Importe le prochain article non encore vu depuis le flux RSS de
// nippon.com (voir src/lib/feeds/news-rss.ts) et l'enregistre comme nouveau
// texte source, prêt à être analysé comme n'importe quel autre texte.
export async function POST() {
  try {
    const sourceText = await ingestNextNewsArticle();

    if (!sourceText) {
      return Response.json(
        { error: "Aucun nouvel article disponible dans le flux pour le moment. Réessaie plus tard." },
        { status: 409 },
      );
    }

    return Response.json({ sourceText }, { status: 201 });
  } catch (error) {
    if (error instanceof NewsRssServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to ingest news RSS article:", error);
    return Response.json(
      { error: "Impossible de récupérer une actualité pour le moment." },
      { status: 500 },
    );
  }
}
