import { NewsRssServiceError, ingestNextNewsArticle } from "@/lib/feeds/news-rss";

// Nombre d'articles importés au maximum par déclenchement du cron, pour ne
// pas noyer l'historique si le flux a beaucoup avancé depuis le dernier run.
const MAX_ARTICLES_PER_RUN = 3;

// Déclenché par le scheduler du fournisseur de déploiement (voir vercel.json)
// pour importer automatiquement les nouveaux articles du flux RSS, au-delà
// du bouton manuel de src/app/api/source-texts/news-rss/route.ts. Protégé
// par CRON_SECRET : Vercel Cron Jobs envoie automatiquement
// "Authorization: Bearer $CRON_SECRET" quand cette variable d'environnement
// est configurée sur le projet.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET n'est pas configuré : le cron news-rss est désactivé.");
    return Response.json({ error: "Cron non configuré." }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const imported: string[] = [];

    for (let i = 0; i < MAX_ARTICLES_PER_RUN; i += 1) {
      const sourceText = await ingestNextNewsArticle();

      if (!sourceText) {
        break;
      }

      imported.push(sourceText.id);
    }

    return Response.json({ imported: imported.length, sourceTextIds: imported });
  } catch (error) {
    if (error instanceof NewsRssServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("News RSS cron failed:", error);
    return Response.json({ error: "Échec de l'import automatique." }, { status: 500 });
  }
}
