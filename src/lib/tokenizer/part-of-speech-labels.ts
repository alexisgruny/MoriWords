// Traduit la catégorie grammaticale d'un token (étiquette kuromoji/IPADIC, en
// japonais) en un mot français compréhensible pour un débutant. N'affecte que
// l'affichage : les valeurs japonaises brutes restent utilisées ailleurs pour
// le filtrage (isNonLexicalToken, classifyDifficulty...).
const PART_OF_SPEECH_LABELS: Record<string, string> = {
  名詞: "nom",
  動詞: "verbe",
  形容詞: "adjectif",
  形容動詞: "adjectif (na)",
  副詞: "adverbe",
  連体詞: "déterminant",
  接続詞: "conjonction",
  助詞: "particule",
  助動詞: "auxiliaire",
  感動詞: "interjection",
  接頭詞: "préfixe",
  記号: "symbole",
  フィラー: "hésitation",
  その他: "autre",
};

// Si la catégorie n'est pas reconnue, on affiche la valeur brute plutôt que
// de cacher l'information (mieux vaut du japonais non traduit qu'un "—" muet).
export function translatePartOfSpeech(partOfSpeech: string | null | undefined): string {
  if (!partOfSpeech) {
    return "";
  }

  return PART_OF_SPEECH_LABELS[partOfSpeech] ?? partOfSpeech;
}
