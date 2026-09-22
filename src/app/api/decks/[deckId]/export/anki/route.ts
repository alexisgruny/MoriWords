import { prisma } from "@/lib/db/prisma";
import { cardsToAnkiTsv } from "@/lib/export/anki";

// Transforme le nom d'un deck en nom de fichier sûr (sans accents ni
// caractères spéciaux), pour le fichier téléchargé.
function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return slug || "deck";
}

// Génère et renvoie en téléchargement un fichier texte au format d'import
// d'Anki, contenant toutes les cartes du deck.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { deckId } = await params;

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: { cards: { orderBy: { createdAt: "desc" } } },
    });

    if (!deck) {
      return Response.json({ error: "Deck introuvable." }, { status: 404 });
    }

    const tsv = cardsToAnkiTsv(deck.cards);
    const filename = `${slugify(deck.name)}-anki.txt`;

    return new Response(tsv, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export deck to Anki format:", error);
    return Response.json(
      { error: "Impossible d'exporter le deck." },
      { status: 500 },
    );
  }
}
