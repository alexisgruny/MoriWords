import { JapaneseTokenizer } from "@/lib/tokenizer/japanese-tokenizer";
import type { TokenResult } from "@/lib/tokenizer/types";

const tokenizer = new JapaneseTokenizer();

type TokenizeRequest = {
  text: string;
};

function isTokenizeRequest(value: unknown): value is TokenizeRequest {
  if (typeof value !== "object" || value === null || !("text" in value)) {
    return false;
  }

  return typeof value.text === "string";
}

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
