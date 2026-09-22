import { prisma } from "@/lib/db/prisma";
import { classifyDifficulty } from "@/lib/difficulty/classify";
import type { TokenResult } from "@/lib/tokenizer/types";

// Forme attendue du corps de la requête pour enregistrer des tokens.
type SaveTokensBody = {
  sourceTextId: string;
  tokens: TokenResult[];
};

// Vérifie que le corps de la requête a bien un sourceTextId et une liste de tokens.
function isSaveTokensBody(value: unknown): value is SaveTokensBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.sourceTextId === "string" &&
    candidate.sourceTextId.trim().length > 0 &&
    Array.isArray(candidate.tokens)
  );
}

// Récupère les tokens d'un texte donné pour les réafficher depuis la DB.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceTextId = searchParams.get("sourceTextId");

    if (!sourceTextId || sourceTextId.trim().length === 0) {
      return Response.json(
        { error: "sourceTextId est requis." },
        { status: 400 },
      );
    }

    const tokens = await prisma.token.findMany({
      where: {
        sourceTextId,
      },
      orderBy: {
        position: "asc",
      },
    });

    return Response.json({
      tokens: tokens.map((token) => ({
        surface: token.surface,
        baseForm: token.lemma ?? token.surface,
        reading: token.reading ?? undefined,
        partOfSpeech: token.partOfSpeech ?? "",
        difficulty: classifyDifficulty(
          token.lemma ?? token.surface,
          token.reading ?? undefined,
          token.partOfSpeech ?? "",
        ),
        position: token.position,
      })),
    });
  } catch {
    return Response.json(
      { error: "Impossible de récupérer les tokens." },
      { status: 500 },
    );
  }
}

// Enregistre la liste de tokens liée à un SourceText.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isSaveTokensBody(body) || body.tokens.length === 0) {
      return Response.json(
        { error: "sourceTextId et tokens sont requis." },
        { status: 400 },
      );
    }

    const created = await prisma.token.createMany({
      data: body.tokens.map((token) => ({
        sourceTextId: body.sourceTextId,
        surface: token.surface,
        lemma: token.baseForm,
        reading: token.reading ?? null,
        partOfSpeech: token.partOfSpeech,
        position: token.position,
        isParticle: token.partOfSpeech === "助詞",
      })),
    });

    return Response.json({ created }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Impossible de sauvegarder les tokens." },
      { status: 500 },
    );
  }
}