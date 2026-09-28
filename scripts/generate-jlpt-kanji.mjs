// Régénère src/lib/kanji/jlpt-kanji-data.ts.
//
// Usage :
//   npm pack kanji-data   (dans un dossier temporaire)
//   tar -xzf kanji-data-*.tgz
//   node scripts/generate-jlpt-kanji.mjs <dossier>/package/data
//
// Source : kanji-data (npm, MIT), qui reprend KANJIDIC (EDRDG, licence
// conforme) pour les lectures/sens et les listes JLPT de Jonathan Waller
// (tanos.co.uk, CC BY) pour le niveau — la même source déjà créditée pour le
// vocabulaire (scripts/generate-jlpt-vocabulary.mjs).
//
// Les sens (en anglais dans la source) sont traduits en français par lots via
// Claude (ANTHROPIC_API_KEY dans .env), pour rester cohérent avec le reste du
// site. Prend quelques minutes et coûte quelques appels API à chaque
// régénération complète.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.argv[2];

if (!dataDir) {
  console.error("Usage: node scripts/generate-jlpt-kanji.mjs <kanji-data>/data");
  process.exit(1);
}

const LEVELS = { 5: "N5", 4: "N4", 3: "N3", 2: "N2", 1: "N1" };

// Ces 20 kanji sont systématiquement retombés sur l'anglais lors de la
// génération (Claude en omet la traduction sans erreur explicite, sur
// plusieurs essais) : traduits à la main une fois pour toutes.
const MANUAL_TRANSLATIONS = {
  "柾": "bois à grain droit",
  "証": "preuve, certificat",
  "霊": "âme, esprit",
  "黙": "silence, se taire",
  "営": "gérer, exploiter (une affaire)",
  "団": "groupe, association",
  "囲": "entourer, enceinte",
  "圧": "pression",
  "塩": "sel",
  "奥": "intérieur, profondeur",
  "宝": "trésor",
  "専": "exclusif, uniquement",
  "将": "général, commandant",
  "届": "parvenir, livrer",
  "巻": "enrouler, tome",
  "帯": "ceinture, obi, zone",
  "庁": "bureau administratif",
  "恋": "amour (romantique)",
  "悩": "souffrir, se tourmenter",
  "戸": "porte coulissante, maison (compteur)",

  // Ceux-ci ont bien été "traduits", mais avec un reliquat anglais ou une
  // coquille (repérés par le test d'orthographe check-french.test.ts) :
  // corrigés à la main pour la même raison que les précédents.
  "配": "distribuer, répartir",
  "荷": "charge, bagage",
  "伽": "infirmière, compagnon de veillée",
  "偵": "espion, détective",
  "儀": "cérémonie, affaire",
  "博": "docteur, vaste",
  "壮": "robuste, vigueur",
  "尋": "chercher, sonder",
  "恭": "respectueux, déférent",
  "揮": "élan, geste",
  "揺": "balancement, oscillation",
  "眼": "œil, regard",

  // Traductions exactes mais trompeuses pour un apprenant : seuls 3 sens
  // anglais sont gardés, parfois rares ou archaïques, et le sens courant
  // manquait (第 traduit « résidence », 著 « arrivée, vêtement »...). Sens
  // principal rétabli à la main après relecture.
  "上": "haut, dessus, monter",
  "予": "à l'avance, prévoir",
  "投": "lancer, jeter",
  "掛": "accrocher, suspendre",
  "観": "observer, regarder, vue",
  "経": "passer (temps), traverser, longitude",
  "徒": "disciple, élève, à pied",
  "文": "phrase, texte, littérature",
  "治": "gouverner, soigner, calmer",
  "原": "origine, plaine, champ",
  "意": "sens, intention, pensée",
  "除": "enlever, exclure",
  "非": "non-, négation, erreur",
  "並": "aligner, rangée, ordinaire",
  "丸": "rond, cercle, entier",
  "匹": "compteur de petits animaux",
  "卒": "fin d'études, soldat",
  "沸": "bouillir, fermenter",
  "準": "norme, semi-, préparer",
  "籍": "registre, état civil",
  "著": "écrire, auteur, remarquable",
  "誌": "revue, magazine, chronique",
  "即": "immédiatement, à savoir",
  "叙": "décrire, conférer (un titre)",
  "后": "impératrice, reine",
  "嚇": "menacer, intimider",
  "就": "prendre (un poste), concernant",
  "往": "aller, partir, jadis",
  "惜": "regretter, dommage, épargner",
  "峠": "col de montagne",
  "士": "lettré, homme de qualité, samouraï",
  "挙": "lever, citer, action",
  "措": "mesure, disposer",
  "糾": "tordre, enquêter",
  "紳": "gentilhomme",
  "第": "numéro d'ordre (第一 = premier)",
  "秀": "excellent, remarquable",
  "窃": "voler, dérober, en secret",
  "納": "payer, livrer, ranger",
  "緊": "tendu, urgent",
  "繁": "prospère, abondant, fréquent",
  "縦": "vertical, longueur",
  "胞": "cellule, placenta",
  "萩": "buisson à fleurs (hagi)",
  "趣": "goût, charme, intérêt",
  "踏": "marcher sur, fouler, pas",
  "遭": "rencontrer (par hasard), subir",
  "鋼": "acier",
  "随": "suivre, selon",
  "椎": "vertèbre, maillet",
  "邸": "résidence, demeure, manoir",
  "訳": "traduction, raison, explication",
  "米": "riz, Amérique, mètre",
  "暮": "vivre, crépuscule, fin",
  "潜": "plonger, se cacher, secret",
  "芹": "céleri d'eau",
  "推": "pousser, recommander, déduire",
  "使": "utiliser, envoyer, ambassadeur",
  "足": "pied, jambe, suffire",
  "乾": "sec, sécher",
  "朕": "nous (impérial)",
};
const MAX_READINGS = 3;
const MAX_MEANINGS = 3;
const BATCH_SIZE = 150;

const meta = JSON.parse(fs.readFileSync(path.join(dataDir, "kanji-meta.json"), "utf8"));

const entries = [];
for (const [rank, level] of Object.entries(LEVELS)) {
  const kanjiList = JSON.parse(fs.readFileSync(path.join(dataDir, "lists", `jlpt-${rank}.json`), "utf8"));

  for (const kanji of kanjiList) {
    const info = meta[kanji];
    if (!info) {
      console.warn("Aucune métadonnée pour", kanji, "- ignoré.");
      continue;
    }

    entries.push({
      kanji,
      level,
      onReadings: info.on_readings.slice(0, MAX_READINGS),
      kunReadings: info.kun_readings.slice(0, MAX_READINGS),
      englishMeaning: info.meanings.slice(0, MAX_MEANINGS).join(", "),
      strokeCount: info.stroke_count,
    });
  }
}

console.log(`${entries.length} kanji à traiter.`);

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY manquant dans .env.");
  process.exit(1);
}
const client = new Anthropic({ apiKey });

async function translateBatch(batch) {
  const list = batch.map((entry) => `${entry.kanji}\t${entry.englishMeaning}`).join("\n");
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Traduis en français chacun de ces sens de kanji, un sens court (2-4 mots, comme dans un dictionnaire, pas de phrase). Le kanji sert de clé pour éviter tout décalage. Réponds uniquement en JSON, un objet {"kanji":"sens en français"}, une entrée par ligne ci-dessous, dans le même ordre.\n\n${list}`,
      },
    ],
  });

  const text = message.content.find((block) => block.type === "text")?.text ?? "";
  return parseTranslationResponse(text);
}

// Claude répond tantôt par un seul objet JSON, tantôt par plusieurs objets
// séparés par des retours à la ligne (JSONL) malgré la consigne : on gère les
// deux pour ne pas perdre un lot entier à cause du deuxième cas.
function parseTranslationResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    // Repli JSONL : un objet {"kanji":"sens"} par ligne, fusionnés.
    const merged = {};
    for (const line of cleaned.split("\n")) {
      const trimmed = line.trim().replace(/,$/, "");
      if (!trimmed) {
        continue;
      }
      try {
        Object.assign(merged, JSON.parse(trimmed));
      } catch {
        // Ligne inexploitable : ignorée, le kanji retombera sur l'anglais.
      }
    }
    return merged;
  }
}

const translations = {};
for (let i = 0; i < entries.length; i += BATCH_SIZE) {
  const batch = entries.slice(i, i + BATCH_SIZE);
  console.log(`Lot ${i / BATCH_SIZE + 1}/${Math.ceil(entries.length / BATCH_SIZE)} (${batch.length} kanji)...`);

  try {
    const result = await translateBatch(batch);
    Object.assign(translations, result);
  } catch (error) {
    console.error("Échec du lot, on retombe sur l'anglais pour ces kanji :", error.message);
  }
}

const missing = entries.filter((entry) => !translations[entry.kanji]);
if (missing.length > 0) {
  console.warn(`${missing.length} kanji sans traduction française (repli sur l'anglais) :`, missing.map((e) => e.kanji).join(""));
}

const lines = entries
  .map((entry) => {
    const meaning = MANUAL_TRANSLATIONS[entry.kanji] ?? translations[entry.kanji] ?? entry.englishMeaning;
    return `${JSON.stringify(entry.kanji)}:{"level":${JSON.stringify(entry.level)},"on":${JSON.stringify(
      entry.onReadings,
    )},"kun":${JSON.stringify(entry.kunReadings)},"meaning":${JSON.stringify(meaning)},"strokes":${entry.strokeCount}}`;
  })
  .join(",");

const output = `// Généré par scripts/generate-jlpt-kanji.mjs. Ne pas éditer à la main.
// Source : package npm "kanji-data" (MIT), qui reprend KANJIDIC (EDRDG,
// licence conforme) pour les lectures et les listes JLPT de Jonathan Waller
// (tanos.co.uk, CC BY) pour le niveau. Sens traduits en français via Claude.
export type RawKanjiEntry = {
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  on: string[];
  kun: string[];
  meaning: string;
  strokes: number;
};

export const KANJI_DATA: Record<string, RawKanjiEntry> = {${lines}};
`;

const outputPath = path.join(here, "../src/lib/kanji/jlpt-kanji-data.ts");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log("Écrit :", outputPath, `(${entries.length} kanji)`);
