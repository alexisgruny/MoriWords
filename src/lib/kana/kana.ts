// Hiragana et katakana avec leur romaji (Hepburn). Une seule table écrite à la
// main (hiragana) : les katakana s'en déduisent par un décalage Unicode fixe.

export type KanaScript = "hiragana" | "katakana";
export type KanaGroup = "base" | "dakuten" | "combo";

export type KanaEntry = {
  kana: string;
  romaji: string;
  // Autres romanisations acceptées en exercice (Kunrei, saisie clavier...).
  alternatives: string[];
  script: KanaScript;
  group: KanaGroup;
  // Le même son dans l'autre écriture (あ <-> ア).
  counterpart: string;
};

type Row = [kana: string, romaji: string, alternatives?: string[]];

const BASE: Row[] = [
  ["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"],
  ["か", "ka"], ["き", "ki"], ["く", "ku"], ["け", "ke"], ["こ", "ko"],
  ["さ", "sa"], ["し", "shi", ["si"]], ["す", "su"], ["せ", "se"], ["そ", "so"],
  ["た", "ta"], ["ち", "chi", ["ti"]], ["つ", "tsu", ["tu"]], ["て", "te"], ["と", "to"],
  ["な", "na"], ["に", "ni"], ["ぬ", "nu"], ["ね", "ne"], ["の", "no"],
  ["は", "ha"], ["ひ", "hi"], ["ふ", "fu", ["hu"]], ["へ", "he"], ["ほ", "ho"],
  ["ま", "ma"], ["み", "mi"], ["む", "mu"], ["め", "me"], ["も", "mo"],
  ["や", "ya"], ["ゆ", "yu"], ["よ", "yo"],
  ["ら", "ra"], ["り", "ri"], ["る", "ru"], ["れ", "re"], ["ろ", "ro"],
  ["わ", "wa"], ["を", "wo", ["o"]], ["ん", "n", ["nn"]],
];

const DAKUTEN: Row[] = [
  ["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"],
  ["ざ", "za"], ["じ", "ji", ["zi"]], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"],
  ["だ", "da"], ["ぢ", "ji", ["di"]], ["づ", "zu", ["du"]], ["で", "de"], ["ど", "do"],
  ["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"],
  ["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"],
];

const COMBO: Row[] = [
  ["きゃ", "kya"], ["きゅ", "kyu"], ["きょ", "kyo"],
  ["しゃ", "sha", ["sya"]], ["しゅ", "shu", ["syu"]], ["しょ", "sho", ["syo"]],
  ["ちゃ", "cha", ["tya", "cya"]], ["ちゅ", "chu", ["tyu", "cyu"]], ["ちょ", "cho", ["tyo", "cyo"]],
  ["にゃ", "nya"], ["にゅ", "nyu"], ["にょ", "nyo"],
  ["ひゃ", "hya"], ["ひゅ", "hyu"], ["ひょ", "hyo"],
  ["みゃ", "mya"], ["みゅ", "myu"], ["みょ", "myo"],
  ["りゃ", "rya"], ["りゅ", "ryu"], ["りょ", "ryo"],
  ["ぎゃ", "gya"], ["ぎゅ", "gyu"], ["ぎょ", "gyo"],
  ["じゃ", "ja", ["zya", "jya"]], ["じゅ", "ju", ["zyu", "jyu"]], ["じょ", "jo", ["zyo", "jyo"]],
  ["びゃ", "bya"], ["びゅ", "byu"], ["びょ", "byo"],
  ["ぴゃ", "pya"], ["ぴゅ", "pyu"], ["ぴょ", "pyo"],
];

// Hiragana (U+3041 à U+3096) -> katakana : même ordre, 0x60 plus loin.
export function toKatakana(hiragana: string): string {
  return hiragana.replace(/[ぁ-ゖ]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) + 0x60),
  );
}

function build(rows: Row[], group: KanaGroup): KanaEntry[] {
  return rows.flatMap(([hiragana, romaji, alternatives = []]) => {
    const katakana = toKatakana(hiragana);
    return [
      { kana: hiragana, romaji, alternatives, script: "hiragana" as const, group, counterpart: katakana },
      { kana: katakana, romaji, alternatives, script: "katakana" as const, group, counterpart: hiragana },
    ];
  });
}

export const KANA: KanaEntry[] = [...build(BASE, "base"), ...build(DAKUTEN, "dakuten"), ...build(COMBO, "combo")];

export const KANA_GROUP_LABELS: Record<KanaGroup, string> = {
  base: "De base",
  dakuten: "Voisés (゛゜)",
  combo: "Combinés (ゃゅょ)",
};

export function filterKana(
  entries: KanaEntry[],
  script: KanaScript,
  group: KanaGroup | "all",
  query: string,
): KanaEntry[] {
  const normalized = query.trim().toLowerCase();

  return entries.filter(
    (entry) =>
      entry.script === script &&
      (group === "all" || entry.group === group) &&
      (!normalized ||
        entry.kana.includes(normalized) ||
        entry.counterpart.includes(normalized) ||
        entry.romaji.startsWith(normalized) ||
        entry.alternatives.some((alternative) => alternative.startsWith(normalized))),
  );
}

// Correction locale d'un exercice : le romaji principal ou une variante
// acceptée, sans tenir compte de la casse ni des espaces.
export function isCorrectKanaAnswer(entry: KanaEntry, answer: string): boolean {
  const normalized = answer.trim().toLowerCase().replace(/\s+/g, "");
  return normalized === entry.romaji || entry.alternatives.includes(normalized);
}
