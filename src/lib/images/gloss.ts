const GLOSS_TIMEOUT_MS = 15_000;

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "French",
  ja: "Japanese",
  en: "English",
};

function languageLabel(languageCode: string): string {
  return LANGUAGE_LABELS[languageCode] ?? languageCode;
}

// Unsplash's search index is effectively English-only: searching it in French
// or Japanese returns irrelevant results (e.g. "délicieux" surfaces cat
// photos). This asks Claude for a short English stock-photo-style keyword
// phrase instead. The source language must be stated explicitly, otherwise
// cross-lingual homographs get misread (French "chat" = cat vs English
// "chat" = conversation). Any failure here just falls back to the original
// term rather than blocking image search.
export async function toEnglishImageQuery(term: string, sourceLanguage: string): Promise<string> {
  const cleanedTerm = term.trim();

  if (!cleanedTerm) {
    return cleanedTerm;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return cleanedTerm;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GLOSS_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 32,
        messages: [
          {
            role: "user",
            content: `The following word or expression is in ${languageLabel(sourceLanguage)}: "${cleanedTerm}". Give a short English keyword phrase (2-4 words, no punctuation, no quotes) suitable for searching a stock photo site to illustrate it visually. Respond with only the phrase.`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return cleanedTerm;
    }

    const payload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = payload.content?.find((entry) => entry.type === "text")?.text?.trim();

    return text && text.length > 0 ? text.replace(/^["']|["']$/g, "") : cleanedTerm;
  } catch {
    return cleanedTerm;
  } finally {
    clearTimeout(timeoutId);
  }
}
