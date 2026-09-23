// Un mot entièrement composé de lettres latines (romaji), comme "PC" ou "AI"
// — pas du vocabulaire japonais à proprement parler.
const ROMAJI_ONLY = /^[A-Za-z]+$/;

// Un mot entièrement composé de chiffres arabes, comme "90" ou "2027".
const ARABIC_DIGITS_ONLY = /^[0-9]+$/;

// La catégorie que kuromoji donne aux symboles et à la ponctuation
// (。、「」！？ etc.) : jamais du vocabulaire à apprendre.
const SYMBOL_PART_OF_SPEECH = "記号";

// Un token de "bruit" à cacher par défaut dans la liste des mots détectés :
// romaji pur, chiffres arabes purs, ou symboles/ponctuation. Le romaji et
// les chiffres se basent sur la forme écrite affichée (surface), pas sur la
// catégorie grammaticale de kuromoji, pour rester fiable même quand kuromoji
// classe ces fragments comme noms communs.
export function isNoiseToken(token: { surface: string; partOfSpeech?: string }): boolean {
  if (token.partOfSpeech === SYMBOL_PART_OF_SPEECH) {
    return true;
  }

  const trimmed = token.surface.trim();

  if (!trimmed) {
    return false;
  }

  return ROMAJI_ONLY.test(trimmed) || ARABIC_DIGITS_ONLY.test(trimmed);
}
