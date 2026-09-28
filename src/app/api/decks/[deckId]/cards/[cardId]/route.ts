import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { findOwnedCard, findOwnedDeck } from "@/lib/decks/ownership";
import { requireOwner } from "@/lib/security/owner";
import { normalizeNullable } from "@/lib/decks/card-utils";

// Modifie une carte : sa lecture et/ou son sens, ou la déplace vers un autre
// deck. Un déplacement est refusé si le deck cible a déjà ce mot (la
// contrainte @@unique([deckId, lemma, ...]) l'empêcherait de toute façon,
// mais on le détecte avant pour renvoyer un message clair).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> },
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
    const { deckId, cardId } = await params;
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Le payload est requis." }, { status: 400 });
    }

    const candidate = body as Record<string, unknown>;

    const card = await findOwnedCard(deckId, cardId, user.id);

    if (!card) {
      return Response.json({ error: "Carte introuvable pour ce deck." }, { status: 404 });
    }

    const targetDeckId = typeof candidate.deckId === "string" ? candidate.deckId : null;

    if (targetDeckId && targetDeckId !== card.deckId) {
      const targetDeck = await findOwnedDeck(targetDeckId, user.id);

      if (!targetDeck) {
        return Response.json({ error: "Deck de destination introuvable." }, { status: 404 });
      }

      const conflict = await prisma.card.findUnique({
        where: {
          deckId_lemma_sourceLanguage_targetLanguage: {
            deckId: targetDeckId,
            lemma: card.lemma,
            sourceLanguage: card.sourceLanguage,
            targetLanguage: card.targetLanguage,
          },
        },
      });

      if (conflict) {
        return Response.json(
          { error: `« ${card.lemma} » existe déjà dans « ${targetDeck.name} ».` },
          { status: 409 },
        );
      }

      const moved = await prisma.card.update({ where: { id: cardId }, data: { deckId: targetDeckId } });

      return Response.json({ card: moved });
    }

    const data: { reading?: string | null; meaning?: string | null } = {};

    if ("reading" in candidate) {
      data.reading = normalizeNullable(candidate.reading as string | null | undefined);
    }

    if ("meaning" in candidate) {
      data.meaning = normalizeNullable(candidate.meaning as string | null | undefined);
    }

    const updated = await prisma.card.update({ where: { id: cardId }, data });

    return Response.json({ card: updated });
  } catch (error) {
    console.error("Failed to update card:", error);
    return Response.json({ error: "Impossible de mettre à jour la carte." }, { status: 500 });
  }
}

// Supprime définitivement une carte (et ses occurrences/révisions liées) d'un deck.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> },
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
    const { deckId, cardId } = await params;

    const card = await findOwnedCard(deckId, cardId, user.id);

    if (!card) {
      return Response.json(
        { error: "Carte introuvable pour ce deck." },
        { status: 404 },
      );
    }

    await prisma.card.delete({ where: { id: cardId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete card:", error);
    return Response.json(
      { error: "Impossible de supprimer la carte." },
      { status: 500 },
    );
  }
}
