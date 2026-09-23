import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

// Flux RSS officiel de nippon.com (édition japonaise, rubrique actualités,
// dépêches Kyodo News), l'alternative retenue à NHK Easy News. NHK Easy n'a
// pas de flux RSS officiel et son robots.txt bloque explicitement les
// crawlers IA (voir PLAN-MVP.txt Priorite 11). nippon.com publie ce flux
// pour être consommé par des lecteurs de flux tiers ; son robots.txt
// n'exclut aucun agent IA et ne bloque pas /ja/rss-others/. On ne récupère
// jamais la page complète d'un article : seuls le titre et le résumé déjà
// tronqués publiés dans le flux lui-même sont utilisés, comme le ferait
// n'importe quel lecteur de flux (vérifié le 2026-09-23).
export const NEWS_RSS_FEED_URL = "https://www.nippon.com/ja/rss-others/news.xml";

// Origin utilisé pour marquer les SourceText créés depuis ce flux (sert
// aussi de filtre pour la déduplication).
export const NEWS_RSS_ORIGIN = "nippon-news-rss";

const FETCH_TIMEOUT_MS = 15_000;

// En dessous de cette longueur, le résumé de la dépêche est essentiellement
// vide (ex. juste le nom de l'agence de presse) et n'apporte rien à étudier.
const MIN_CONTENT_LENGTH = 15;

export class NewsRssServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsRssServiceError";
  }
}

export type NewsRssItem = {
  title: string;
  sourceUrl: string;
  publishedAt: Date | null;
  content: string;
};

// CDATA est extrait par fast-xml-parser dans une clé dédiée (voir
// cdataPropName ci-dessous) plutôt que renvoyé comme texte brut.
const cdataOrTextSchema = z.union([z.string(), z.object({ __cdata: z.string() })]);

const rawItemSchema = z.object({
  title: cdataOrTextSchema,
  link: z.string().url(),
  pubDate: z.string().optional(),
  description: cdataOrTextSchema.optional(),
});

function extractText(value: z.infer<typeof cdataOrTextSchema> | undefined): string {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.__cdata;
}

// Télécharge et parse le flux RSS, sans jamais aller chercher la page
// complète d'un article (voir le commentaire sur NEWS_RSS_FEED_URL).
export async function fetchNewsRssItems(): Promise<NewsRssItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(NEWS_RSS_FEED_URL, {
      headers: {
        // Identifie clairement l'appli plutôt que d'usurper un navigateur.
        "User-Agent": "MoriWords/1.0 (personal language-learning app)",
      },
      signal: controller.signal,
    });
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new NewsRssServiceError("Le flux RSS d'actualités met trop de temps à répondre.");
    }

    console.error("News RSS fetch failed:", fetchError);
    throw new NewsRssServiceError("Le flux RSS d'actualités est injoignable pour le moment.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error(`News RSS HTTP error (${response.status}):`, response.statusText);
    throw new NewsRssServiceError("Le flux RSS d'actualités est momentanément indisponible.");
  }

  const xml = await response.text();
  const parser = new XMLParser({ cdataPropName: "__cdata", trimValues: true });

  let parsed: unknown;

  try {
    parsed = parser.parse(xml);
  } catch (parseError) {
    console.error("News RSS parse failed:", parseError);
    throw new NewsRssServiceError("Le flux RSS d'actualités n'a pas pu être lu.");
  }

  const rawItems = (parsed as { rss?: { channel?: { item?: unknown } } })?.rss?.channel?.item;
  const itemList = Array.isArray(rawItems) ? rawItems : rawItems !== undefined ? [rawItems] : [];

  const items: NewsRssItem[] = [];

  for (const rawItem of itemList) {
    const result = rawItemSchema.safeParse(rawItem);

    if (!result.success) {
      continue;
    }

    const content = extractText(result.data.description).trim();

    if (content.length < MIN_CONTENT_LENGTH) {
      continue;
    }

    items.push({
      title: extractText(result.data.title).trim(),
      sourceUrl: result.data.link,
      publishedAt: result.data.pubDate ? new Date(result.data.pubDate) : null,
      content,
    });
  }

  return items;
}

// Prend le premier article du flux qui n'a pas déjà été importé (dédoublonné
// par sourceUrl) et le sauvegarde comme SourceText. Renvoie null si tous les
// articles actuellement dans le flux ont déjà été importés (le flux se
// renouvelle au fil de la journée ; il suffit de réessayer plus tard).
export async function ingestNextNewsArticle() {
  const items = await fetchNewsRssItems();

  if (items.length === 0) {
    return null;
  }

  const alreadyImported = await prisma.sourceText.findMany({
    where: {
      origin: NEWS_RSS_ORIGIN,
      sourceUrl: { in: items.map((item) => item.sourceUrl) },
    },
    select: { sourceUrl: true },
  });
  const importedUrls = new Set(alreadyImported.map((entry) => entry.sourceUrl));

  const nextItem = items.find((item) => !importedUrls.has(item.sourceUrl));

  if (!nextItem) {
    return null;
  }

  return prisma.sourceText.create({
    data: {
      // Comme pour les autres sources générées, title reste une métadonnée
      // distincte du contenu (jamais dupliquée dedans) : elle est déjà
      // affichée séparément dans l'historique, et un doublon y serait à la
      // fois redondant visuellement et pour un lecteur d'écran.
      content: nextItem.content,
      title: nextItem.title,
      origin: NEWS_RSS_ORIGIN,
      category: "news",
      sourceLanguage: "ja",
      targetLanguage: "fr",
      sourceUrl: nextItem.sourceUrl,
    },
  });
}
