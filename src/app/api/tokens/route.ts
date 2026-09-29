import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { findOwnedSourceText } from "@/lib/decks/ownership";
import { limitUserWrites } from "@/lib/security/rate-limit";
import { classifyDifficulty } from "@/lib/difficulty/classify";
import { parseTokenList } from "@/lib/security/token-payload";


// Récupère les tokens d'un texte donné pour les réafficher depuis la DB.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

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
        sourceText: { userId: user.id },
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
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  const writesLimited = await limitUserWrites(user.id);
  if (writesLimited) {
    return writesLimited;
  }

  try {
    const body: unknown = await request.json();
    const candidate = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const sourceTextId = typeof candidate.sourceTextId === "string" ? candidate.sourceTextId : "";
    const tokens = parseTokenList(candidate.tokens);

    if (!sourceTextId || !tokens) {
      return Response.json({ error: "sourceTextId et tokens sont requis." }, { status: 400 });
    }

    if (!(await findOwnedSourceText(sourceTextId, user.id))) {
      return Response.json({ error: "Texte introuvable." }, { status: 404 });
    }

    // Un texte n'a qu'une analyse : un nouvel envoi remplace l'ancien au lieu
    // de s'y ajouter (sinon on pouvait gonfler la base en boucle).
    await prisma.token.deleteMany({ where: { sourceTextId } });

    const created = await prisma.token.createMany({
      data: tokens.map((token) => ({
        sourceTextId,
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