import { JapaneseTokenizer } from "@/lib/tokenizer/japanese-tokenizer";
import type { TokenResult } from "@/lib/tokenizer/types";

// Un seul tokenizer partagé par toutes les requêtes, pour ne charger le
// dictionnaire kuromoji qu'une seule fois.
const tokenizer = new JapaneseTokenizer();

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
  try {
    const body: unknown = await request.json();

    if (!isTokenizeRequest(body) || body.text.trim().length === 0) {
      return Response.json(
        { error: "Le texte japonais est requis." },
        { status: 400 },
      );
    }

    const tokens: TokenResult[] = await tokenizer.tokenize(body.text);

    return Response.json({ tokens });
  } catch {
    return Response.json(
      { error: "Impossible d'analyser le texte pour le moment." },
      { status: 500 },
    );
  }
}
