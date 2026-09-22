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

// Renvoie les 6 derniers textes analysés, pour l'historique de la page d'accueil.
export async function GET() {
  try {
    const sourceTexts = await prisma.sourceText.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    });

    return Response.json({ sourceTexts });
  } catch {
    return Response.json(
      { error: "Impossible de récupérer les textes." },
      { status: 500 },
    );
  }
}
