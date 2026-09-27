import { prisma } from "@/lib/db/prisma";

// Renvoie toutes les cartes dues, tous decks confondus, triées par échéance
// (les plus en retard d'abord), avec le nom du deck de chacune. Sert la page
// « Réviser tout », qui permet d'enchaîner les révisions sans changer de deck.
export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      where: { dueAt: { lte: new Date() } },
      orderBy: { dueAt: "asc" },
      include: { deck: { select: { id: true, name: true } } },
    });

    return Response.json({ cards });
  } catch (error) {
    console.error("Failed to fetch due cards:", error);
    return Response.json({ error: "Impossible de récupérer les cartes à réviser." }, { status: 500 });
  }
}
