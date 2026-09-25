import { MISSING_TRANSLATION_PLACEHOLDER, translateText } from "@/lib/translation/translate";

// Traduit un mot pour lui donner un sens (traduction en cache si elle existe
// déjà, sinon appel à Claude). Ne lève jamais d'erreur : en cas d'échec ou de
// clé API absente, renvoie null et l'appelant garde la carte sans sens.
export async function autoTranslateLemma(lemma: string): Promise<string | null> {
  try {
    const result = await translateText(lemma, "ja", "fr");
    const translation = result.translation.trim();

    if (!translation || translation === MISSING_TRANSLATION_PLACEHOLDER) {
      return null;
    }

    return translation;
  } catch (error) {
    console.error("Auto-translation failed:", error);
    return null;
  }
}
