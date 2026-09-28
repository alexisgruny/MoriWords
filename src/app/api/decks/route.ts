import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

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

  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || typeof (body as Record<string, unknown>).name !== "string") {
      return Response.json(
        { error: "Le nom du deck est requis." },
        { status: 400 },
      );
    }

    const deck = await prisma.deck.create({
      data: {
        userId: user.id,
        name: (body as Record<string, unknown>).name as string,
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
