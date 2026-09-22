// Délai maximum d'attente de la réponse de Claude avant d'abandonner.
const GLOSS_TIMEOUT_MS = 15_000;

// Noms de langues en anglais, utilisés dans le prompt envoyé à Claude.
const LANGUAGE_LABELS: Record<string, string> = {
  fr: "French",
  ja: "Japanese",
  en: "English",
};

// Convertit un code de langue ("fr") en son nom anglais ("French"), ou
// renvoie le code tel quel si on ne le connaît pas.
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

  // Sans clé API, on renvoie simplement le mot d'origine sans le traduire.
  if (!apiKey || apiKey.trim().length === 0) {
    return cleanedTerm;
  }

  // Prépare l'annulation automatique si la requête prend trop de temps.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GLOSS_TIMEOUT_MS);

  try {
    // Demande à Claude un court mot-clé anglais qui illustre bien le terme.
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

    // En cas d'erreur de l'API, on se rabat simplement sur le mot d'origine.
    if (!response.ok) {
      return cleanedTerm;
    }

    const payload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = payload.content?.find((entry) => entry.type === "text")?.text?.trim();

    // Utilise la réponse de Claude si elle existe, sinon le mot d'origine.
    return text && text.length > 0 ? text.replace(/^["']|["']$/g, "") : cleanedTerm;
  } catch {
    // Toute erreur (réseau, délai dépassé) se traduit par un repli silencieux.
    return cleanedTerm;
  } finally {
    clearTimeout(timeoutId);
  }
}
