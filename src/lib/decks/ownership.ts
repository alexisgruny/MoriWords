import { prisma } from "@/lib/db/prisma";

// Recherches filtrées par propriétaire : une ressource d'un autre compte
// répond comme si elle n'existait pas (404), sans révéler qu'elle existe.

export function findOwnedDeck(deckId: string, userId: string) {
  return prisma.deck.findFirst({ where: { id: deckId, userId } });
}

export function findOwnedCard(deckId: string, cardId: string, userId: string) {
  return prisma.card.findFirst({ where: { id: cardId, deckId, deck: { userId } } });
}

export function findOwnedSourceText(sourceTextId: string, userId: string) {
  return prisma.sourceText.findFirst({ where: { id: sourceTextId, userId } });
}
