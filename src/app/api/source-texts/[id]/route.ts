import { requireUser } from "@/lib/auth/session";
import { findOwnedSourceText } from "@/lib/decks/ownership";

// Renvoie un seul texte source (contenu complet), pour rouvrir un texte déjà
// analysé depuis l'historique de la page d'accueil ou la page /historique.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const { id } = await params;

    const sourceText = await findOwnedSourceText(id, user.id);

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
