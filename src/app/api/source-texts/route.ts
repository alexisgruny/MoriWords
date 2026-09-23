import { prisma } from "@/lib/db/prisma";

// Forme attendue du corps de la requête pour créer un texte source.
type CreateSourceTextBody = {
  content: string;
  title?: string;
  origin?: string;
  category?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  sourceUrl?: string;
};

// Vérifie que le corps de la requête a au moins un champ "content".
function isCreateSourceTextBody(
  value: unknown,
): value is CreateSourceTextBody {
  return typeof value === "object" && value !== null && "content" in value;
}

// Enregistre un nouveau texte source (collé manuellement ou généré) en base.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !isCreateSourceTextBody(body) ||
      typeof body.content !== "string" ||
      body.content.trim().length === 0
    ) {
      return Response.json(
        { error: "Le contenu du texte est requis." },
        { status: 400 },
      );
    }

    const sourceText = await prisma.sourceText.create({
      data: {
        content: body.content,
        title: body.title,
        origin: body.origin ?? "manual",
        category: body.category,
        sourceLanguage: body.sourceLanguage ?? "ja",
        targetLanguage: body.targetLanguage ?? "fr",
        sourceUrl: body.sourceUrl,
      },
    });

    return Response.json({ sourceText }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Impossible de sauvegarder le texte." },
      { status: 500 },
    );
  }
}

// Nombre de textes renvoyés par défaut (historique de la page d'accueil) et
// maximum autorisé par page (pour la page /historique, qui peut demander plus).
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 50;

// Renvoie les derniers textes analysés. Sans paramètres, se comporte comme
// avant (les 6 derniers, pour l'historique de la page d'accueil). Avec q,
// filtre sur le titre ou le contenu (recherche insensible à la casse) ;
// avec limit/offset, permet de parcourir tout l'historique par pages
// (utilisé par /historique).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const offsetParam = Number(searchParams.get("offset"));
    const offset = Number.isInteger(offsetParam) && offsetParam > 0 ? offsetParam : 0;

    const where = query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { content: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [sourceTexts, total] = await Promise.all([
      prisma.sourceText.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.sourceText.count({ where }),
    ]);

    return Response.json({ sourceTexts, total, hasMore: offset + sourceTexts.length < total });
  } catch {
    return Response.json(
      { error: "Impossible de récupérer les textes." },
      { status: 500 },
    );
  }
}
