import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { findOwnedDeck } from "@/lib/decks/ownership";
import { requireOwner } from "@/lib/security/owner";

// Renvoie un seul deck avec ses cartes, pour la page de détail d'un deck.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const { deckId } = await params;

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: user.id },
      include: { cards: { orderBy: { createdAt: "desc" } } },
    });

    if (!deck) {
      return Response.json({ error: "Deck introuvable." }, { status: 404 });
    }

    return Response.json({ deck });
  } catch (error) {
    console.error("Failed to fetch deck:", error);
    return Response.json(
      { error: "Impossible de récupérer le deck." },
      { status: 500 },
    );
  }
}

// Renomme un deck (et/ou change sa description).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  const denied = requireOwner(request);
  if (denied) {
    return denied;
  }

  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const { deckId } = await params;
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Le payload est requis." }, { status: 400 });
    }

    const candidate = body as Record<string, unknown>;
    const data: { name?: string; description?: string | null } = {};

    if ("name" in candidate) {
      const name = typeof candidate.name === "string" ? candidate.name.trim() : "";

      if (!name) {
        return Response.json({ error: "Le nom du deck est requis." }, { status: 400 });
      }

      data.name = name;
    }

    if ("description" in candidate) {
      data.description =
        typeof candidate.description === "string" && candidate.description.trim().length > 0
          ? candidate.description.trim()
          : null;
    }

    const deck = await findOwnedDeck(deckId, user.id);

    if (!deck) {
      return Response.json({ error: "Deck introuvable." }, { status: 404 });
    }

    const updated = await prisma.deck.update({ where: { id: deckId }, data });

    return Response.json({ deck: updated });
  } catch (error) {
    console.error("Failed to update deck:", error);
    return Response.json({ error: "Impossible de mettre à jour le deck." }, { status: 500 });
  }
}

// Supprime définitivement un deck ; ses cartes sont supprimées en cascade
// (voir onDelete: Cascade sur Card.deck dans le schéma Prisma).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  const denied = requireOwner(request);
  if (denied) {
    return denied;
  }

  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const { deckId } = await params;

    const deck = await findOwnedDeck(deckId, user.id);

    if (!deck) {
      return Response.json({ error: "Deck introuvable." }, { status: 404 });
    }

    await prisma.deck.delete({ where: { id: deckId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete deck:", error);
    return Response.json(
      { error: "Impossible de supprimer le deck." },
      { status: 500 },
    );
  }
}
