import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MAX_DECK_DESCRIPTION_LENGTH, MAX_DECK_NAME_LENGTH, tooLongResponse } from "@/lib/security/input-limits";
import { limitUserWrites } from "@/lib/security/rate-limit";

// Renvoie les decks de l'utilisateur avec leurs cartes, du plus récent au plus ancien.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const decks = await prisma.deck.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        cards: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return Response.json({ decks });
  } catch {
    return Response.json(
      { error: "Impossible de récupérer les decks." },
      { status: 500 },
    );
  }
}

// Crée un nouveau deck vide avec un nom (et une description optionnelle).
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

    if (typeof body !== "object" || body === null || typeof (body as Record<string, unknown>).name !== "string") {
      return Response.json(
        { error: "Le nom du deck est requis." },
        { status: 400 },
      );
    }

    const candidate = body as Record<string, unknown>;
    const name = (candidate.name as string).trim();
    if (!name) {
      return Response.json({ error: "Le nom du deck est requis." }, { status: 400 });
    }
    if (name.length > MAX_DECK_NAME_LENGTH) {
      return tooLongResponse("Le nom du deck", MAX_DECK_NAME_LENGTH);
    }
    if (typeof candidate.description === "string" && candidate.description.length > MAX_DECK_DESCRIPTION_LENGTH) {
      return tooLongResponse("La description", MAX_DECK_DESCRIPTION_LENGTH);
    }

    const deck = await prisma.deck.create({
      data: {
        userId: user.id,
        name,
        description: typeof (body as Record<string, unknown>).description === "string"
          ? ((body as Record<string, unknown>).description as string)
          : null,
      },
      include: {
        cards: true,
      },
    });

    return Response.json({ deck }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Impossible de créer le deck." },
      { status: 500 },
    );
  }
}
