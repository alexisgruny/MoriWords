// Régénère src/lib/difficulty/jlpt-vocabulary.ts.
//
// Usage :
//   npm pack @polyglot-bundles/ja-jlpt-syllabi   (dans un dossier temporaire)
//   tar -xzf polyglot-bundles-ja-jlpt-syllabi-*.tgz
//   node scripts/generate-jlpt-vocabulary.mjs <dossier>/package/src/generated/jlpt-syllabus.json
//
// Règles :
// - Le dataset "egg rolls" range N5 et N4 dans une seule liste ; les listes
//   scripts/data/jlpt-n5.csv et jlpt-n4.csv (Tanos) font foi pour ces deux
//   niveaux. Un mot de la liste fusionnée absent des deux listes est rangé en N4
//   (N5 est la liste complète et courte, le reste de la liste fusionnée est N4),
//   sauf s'il s'agit de la graphie en kana d'un mot de ces listes.
// - Quand un même mot apparaît à plusieurs niveaux, le plus facile l'emporte.
// - Deux tables : JLPT_WORDS (forme écrite -> niveau) et JLPT_READINGS
//   (lecture -> niveau). Les séparer évite qu'une lecture (ex. « ます » de 増す, N1)
//   soit prise pour un mot (l'auxiliaire poli ます).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const syllabusPath = process.argv[2];

if (!syllabusPath) {
  console.error("Usage: node scripts/generate-jlpt-vocabulary.mjs <jlpt-syllabus.json>");
  process.exit(1);
}

// Plus le rang est élevé, plus le niveau est facile.
const RANK = { N5: 5, N4: 4, N3: 3, N2: 2, N1: 1 };
const MERGED_N5_N4 = "N5N4";

// Même normalisation que classify.ts.
const normalize = (value) => value.trim().toLowerCase();
const isAffix = (value) => /^[〜～]/.test(value);

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (inQuotes) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function readTanosList(fileName) {
  return fs
    .readFileSync(path.join(here, "data", fileName), "utf8")
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map(parseCsvLine)
    .map(([expression, reading]) => ({ surface: expression, reading }));
}

const LEVEL_BY_CHAPTER_TAG = { "n5-n4": MERGED_N5_N4, n3: "N3", n2: "N2", n1: "N1" };

const syllabus = JSON.parse(fs.readFileSync(syllabusPath, "utf8"));
const eggRollsEntries = [];

for (const chapter of syllabus.children) {
  for (const lesson of chapter.children) {
    const level = LEVEL_BY_CHAPTER_TAG[lesson.metadata?.jlptLevel];

    if (!level) {
      throw new Error(`Niveau inconnu dans la leçon ${lesson.id}: ${lesson.metadata?.jlptLevel}`);
    }

    for (const set of lesson.children ?? []) {
      for (const item of set.children ?? []) {
        eggRollsEntries.push({ surface: item.word, reading: item.transcription, level });
      }
    }
  }
}

const tanosN5 = readTanosList("jlpt-n5.csv");
const tanosN4 = readTanosList("jlpt-n4.csv");

// Phase 1 : niveau de chaque forme écrite d'après egg rolls (le plus facile gagne).
const words = new Map();

function putEasiest(map, rawKey, level) {
  const key = normalize(rawKey ?? "");

  if (!key || isAffix(key)) {
    return;
  }

  const current = map.get(key);
  const rank = (value) => (value === MERGED_N5_N4 ? RANK.N5 : RANK[value]);

  if (!current || rank(level) > rank(current)) {
    map.set(key, level);
  }
}

for (const entry of eggRollsEntries) {
  putEasiest(words, entry.surface, entry.level);
}

// Phase 2 : les listes Tanos N4 puis N5 font foi pour les deux niveaux faciles (N5 gagne).
for (const entry of tanosN4) {
  const key = normalize(entry.surface);
  if (key && !isAffix(key)) words.set(key, "N4");
}
for (const entry of tanosN5) {
  const key = normalize(entry.surface);
  if (key && !isAffix(key)) words.set(key, "N5");
}

// Le reste de la liste fusionnée "N5–N4" : une graphie en kana d'un mot des listes
// Tanos (ある, いる, いい...) prend le niveau de ce mot ; sinon c'est du N4.
const tanosReadingLevel = new Map();
for (const entry of tanosN4) putEasiest(tanosReadingLevel, entry.reading, "N4");
for (const entry of tanosN5) putEasiest(tanosReadingLevel, entry.reading, "N5");

const KANA_ONLY = /^[぀-ゟ゠-ヿー]+$/;

for (const [key, level] of words) {
  if (level === MERGED_N5_N4) {
    words.set(key, (KANA_ONLY.test(key) && tanosReadingLevel.get(key)) || "N4");
  }
}

// Phase 3 : lecture -> niveau, d'après le niveau final du mot correspondant.
const readings = new Map();
const allEntries = [...eggRollsEntries, ...tanosN4, ...tanosN5];

for (const entry of allEntries) {
  const finalLevel = words.get(normalize(entry.surface ?? ""));

  if (finalLevel && entry.reading) {
    putEasiest(readings, entry.reading, finalLevel);
  }
}

function toSortedObject(map) {
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b, "ja")));
}

const counts = (map) =>
  [...map.values()].reduce((acc, level) => ({ ...acc, [level]: (acc[level] ?? 0) + 1 }), {});

const output = `// Généré par scripts/generate-jlpt-vocabulary.mjs. Ne pas éditer à la main.
// Sources : @polyglot-bundles/ja-jlpt-syllabi (egg rolls JLPT 10k) pour tous les
// niveaux ; listes de Jonathan Waller (tanos.co.uk, CC BY) pour séparer N5 et N4.
export type JlptVocabularyLevel = "N5" | "N4" | "N3" | "N2" | "N1";

// Forme écrite (kanji ou kana) -> niveau.
export const JLPT_WORDS: Record<string, JlptVocabularyLevel> = ${JSON.stringify(toSortedObject(words))};

// Lecture en kana -> niveau (le plus facile en cas d'homophones).
export const JLPT_READINGS: Record<string, JlptVocabularyLevel> = ${JSON.stringify(toSortedObject(readings))};
`;

fs.writeFileSync(path.join(here, "..", "src", "lib", "difficulty", "jlpt-vocabulary.ts"), output);
console.log("Mots :", words.size, counts(words));
console.log("Lectures :", readings.size, counts(readings));
