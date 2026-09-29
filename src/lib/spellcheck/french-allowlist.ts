// Mots absents du dictionnaire français (dictionary-fr) mais légitimes dans
// le contenu du site : termes de linguistique japonaise, niveaux JLPT, noms
// propres et romanisations. Complété au fur et à mesure des faux positifs
// trouvés par check-french.test.ts (jamais pour cacher une vraie faute).
export const FRENCH_ALLOWLIST: string[] = [
  // Niveaux JLPT
  "JLPT",
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",

  // Linguistique japonaise (romanisation Hepburn)
  "godan",
  "ichidan",
  "okurigana",
  "furigana",
  "kanji",
  "kana",
  "hiragana",
  "katakana",
  "kun'yomi",
  "on'yomi",
  // Parcours débutant (src/lib/course/lessons.ts) : syllabes et mots en
  // rōmaji donnés comme prononciation, noms des signes diacritiques.
  "ten",
  "maru",
  "ka", "ki", "ku", "ko", "ga", "sa", "shi", "su", "so", "sho", "sha", "shin",
  "za", "da", "de", "t", "te", "tsu", "na", "ne", "n", "wa", "fu", "pa", "k",
  "kō", "kya", "kyō", "kitte", "kōhī", "suki", "desu",
  // Mot anglais cité comme origine d'un emprunt (コーヒー < coffee).
  "coffee",
  "keigo",
  "sonkeigo",
  "kenjougo",
  "teineigo",
  "kyouiku",
  "kokuji",
  "daimyo",
  "satori",
  "shogi",
  "zelkova",
  "fuki",
  "hagi",
  "sake",
  "ayu",
  "monme",
  "rin",
  "cryptomère",

  // Marques, organisations, personnes, lieux
  "MoriWords",
  "Claude",
  "Anthropic",
  "Vercel",
  "Neon",
  "Tanos",
  "KANJIDIC",
  "EDRDG",
  "Waller",
  "Fuji",
  "Nara",
  "Yamato",
  "Natsume",
  "Sōseki",

  // Tournures françaises correctes que le dictionnaire ne reconnaît pas
  // (contractions/inversions avec trait d'union ou apostrophe, tournures
  // hyphénées de linguistique) — vérifiées, pas des fautes.
  "wa",
  "Qu'est-ce",
  "Puis-je",
  "soit-il",
  "causative-passive",
  "petit-enfant",
];
