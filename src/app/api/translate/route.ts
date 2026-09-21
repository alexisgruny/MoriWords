import { translateText } from "@/lib/translation/translate";

type TranslateRequest = {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

function isTranslateRequest(value: unknown): value is TranslateRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.text === "string";
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isTranslateRequest(body) || body.text.trim().length === 0) {
      return Response.json(
        { error: "Le texte à traduire est requis." },
        { status: 400 },
      );
    }

    const result = await translateText(
      body.text,
      body.sourceLanguage ?? "ja",
      body.targetLanguage ?? "fr",
    );

    return Response.json({ result });
  } catch (error) {
    console.error("Translation request failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de traduire le texte pour le moment.",
      },
      { status: 500 },
    );
  }
}
