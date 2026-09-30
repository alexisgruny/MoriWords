import { requireUser } from "@/lib/auth/session";
import { MAX_ANALYSIS_TEXT_LENGTH, tooLongResponse } from "@/lib/security/input-limits";
import { getJapaneseTokenizer } from "@/lib/tokenizer/japanese-tokenizer";
import type { TokenResult } from "@/lib/tokenizer/types";

// Forme attendue du corps de la requête.
type TokenizeRequest = {
  text: string;
};

// Vérifie que le corps de la requête a bien un champ "text" de type chaîne.
function isTokenizeRequest(value: unknown): value is TokenizeRequest {
  if (typeof value !== "object" || value === null || !("text" in value)) {
    return false;
  }

  return typeof value.text === "string";
}

// Découpe un texte japonais en mots analysés (tokens), sans le sauvegarder.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const body: unknown = await request.json();

    if (!isTokenizeRequest(body) || body.text.trim().length === 0) {
      return Response.json(
        { error: "Le texte japonais est requis." },
        { status: 400 },
      );
    }

    if (body.text.length > MAX_ANALYSIS_TEXT_LENGTH) {
      return tooLongResponse("Le texte", MAX_ANALYSIS_TEXT_LENGTH);
    }

    const tokens: TokenResult[] = await getJapaneseTokenizer().tokenize(body.text);

    return Response.json({ tokens });
  } catch {
    return Response.json(
      { error: "Impossible d'analyser le texte pour le moment." },
      { status: 500 },
    );
  }
}
