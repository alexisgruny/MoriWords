import { requireUser } from "@/lib/auth/session";
import { MASTERY_KINDS, type MasteryKind, getMastery } from "@/lib/grammar/mastery";

// Réussite par élément pour une page de référence (?kind=kana|kanji|grammar|conjugation).
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  const kind = new URL(request.url).searchParams.get("kind");

  if (!MASTERY_KINDS.includes(kind as MasteryKind)) {
    return Response.json({ error: "Type d'exercice inconnu." }, { status: 400 });
  }

  try {
    return Response.json({ items: await getMastery(user.id, kind as MasteryKind) });
  } catch (error) {
    console.error("Failed to load exercise mastery:", error);
    return Response.json({ error: "Impossible de charger ta progression." }, { status: 500 });
  }
}
