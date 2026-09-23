import { getDistractorTranslations } from "@/lib/translation/translate";

// Renvoie un échantillon de traductions déjà connues, pour servir de leurres
// dans le mode quiz du deck. exclude est une liste de sens séparés par "|"
// (au minimum la bonne réponse, pour ne jamais la proposer deux fois).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeParam = searchParams.get("exclude") ?? "";
    const excludeMeanings = excludeParam
      .split("|")
      .map((meaning) => meaning.trim())
      .filter((meaning) => meaning.length > 0);

    const countParam = Number(searchParams.get("count"));
    const count = Number.isInteger(countParam) && countParam > 0 ? Math.min(countParam, 10) : 3;

    const sourceLanguage = searchParams.get("sourceLanguage") ?? "ja";
    const targetLanguage = searchParams.get("targetLanguage") ?? "fr";

    const translations = await getDistractorTranslations(
      excludeMeanings,
      count,
      sourceLanguage,
      targetLanguage,
    );

    return Response.json({ translations });
  } catch (error) {
    console.error("Failed to fetch quiz distractors:", error);
    return Response.json(
      { error: "Impossible de récupérer des propositions pour le quiz." },
      { status: 500 },
    );
  }
}
