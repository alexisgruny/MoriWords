import { prisma } from "@/lib/db/prisma";

// Renvoie un seul texte source (contenu complet), pour rouvrir un texte déjà
// analysé depuis l'historique de la page d'accueil ou la page /historique.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const sourceText = await prisma.sourceText.findUnique({ where: { id } });

    if (!sourceText) {
      return Response.json({ error: "Texte introuvable." }, { status: 404 });
    }

    return Response.json({ sourceText });
  } catch (error) {
    console.error("Failed to fetch source text:", error);
    return Response.json(
      { error: "Impossible de récupérer le texte." },
      { status: 500 },
    );
  }
}
