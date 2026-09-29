// Régénère public/strokes/ : les tracés (ordre et forme des traits) des kana
// et des kanji JLPT, pour l'exercice d'écriture (Hanzi Writer).
//
// Usage :
//   npm pack @k1low/hanzi-writer-data-jp@0.8.0   (dans un dossier temporaire)
//   tar -xzf k1low-hanzi-writer-data-jp-0.8.0.tgz
//   node scripts/generate-stroke-data.mjs <dossier>/package
//
// Source : @k1low/hanzi-writer-data-jp (forme japonaise des caractères),
// tirée d'animCJK (LGPL) et de Make Me a Hanzi (polices Arphic, Arphic
// Public License). Les licences sont copiées à côté des données.
//
// Correction : pour animer les boucles, la source découpe certains traits de
// kana en plusieurs morceaux (あ : 4 au lieu de 3). Le morceau en trop répète
// la fin du précédent : on le fusionne, sinon l'exercice demanderait de
// dessiner des traits qui n'existent pas.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = process.argv[2];
const outputDir = path.join(here, "..", "public", "strokes");

if (!sourceDir) {
  console.error("Usage : node scripts/generate-stroke-data.mjs <dossier package>");
  process.exit(1);
}

// Caractères utiles : kana simples et voisés (pas les combinés comme きゃ,
// qui s'écrivent avec deux kana), et les kanji JLPT du site.
const hiragana = [];
for (let code = 0x3041; code <= 0x3093; code += 1) {
  hiragana.push(String.fromCharCode(code));
}
const kana = [...hiragana, ...hiragana.map((char) => String.fromCharCode(char.charCodeAt(0) + 0x60))];

const kanjiSource = fs.readFileSync(path.join(here, "..", "src", "lib", "kanji", "jlpt-kanji-data.ts"), "utf8");
const marker = "KANJI_DATA: Record<string, RawKanjiEntry> = ";
const kanji = Object.keys(JSON.parse(kanjiSource.slice(kanjiSource.indexOf(marker) + marker.length).trim().replace(/;\s*$/, "")));

const sameTail = (a, b, n = 3) =>
  a.length >= n && b.length >= n && a.slice(-n).every((point, i) => point[0] === b[b.length - n + i][0] && point[1] === b[b.length - n + i][1]);

function mergeSplitStrokes(data) {
  const strokes = [];
  const medians = [];

  data.medians.forEach((median, index) => {
    const last = medians.length - 1;
    if (last >= 0 && sameTail(medians[last], median)) {
      strokes[last] += ` ${data.strokes[index]}`;
      return;
    }
    strokes.push(data.strokes[index]);
    medians.push(median);
  });

  return { strokes, medians };
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

let written = 0;
const missing = [];

for (const char of [...kana, ...kanji]) {
  const file = path.join(sourceDir, `${char}.json`);
  if (!fs.existsSync(file)) {
    missing.push(char);
    continue;
  }
  const data = mergeSplitStrokes(JSON.parse(fs.readFileSync(file, "utf8")));
  // Nom de fichier en code point : pas de caractères japonais dans les URL.
  const name = char.codePointAt(0).toString(16);
  fs.writeFileSync(path.join(outputDir, `${name}.json`), JSON.stringify(data));
  written += 1;
}

for (const license of ["ARPHICPL.TXT", "LGPL.txt", "COPYING.txt"]) {
  const from = path.join(sourceDir, "licenses", license);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(outputDir, license));
  }
}

fs.writeFileSync(
  path.join(outputDir, "README.txt"),
  [
    "Tracés des caractères (kana et kanji JLPT) utilisés par l'exercice d'écriture de MoriWords.",
    "Source : @k1low/hanzi-writer-data-jp 0.8.0 (https://github.com/k1LoW/hanzi-writer-data-jp),",
    "d'après animCJK (https://github.com/parsimonhi/animCJK, LGPL, voir LGPL.txt) et Make Me a Hanzi",
    "(https://github.com/skishore/makemeahanzi, polices Arphic, Arphic Public License, voir ARPHICPL.TXT).",
    "Modification : fusion des morceaux de traits découpés pour l'animation (kana à boucle).",
    "Généré par scripts/generate-stroke-data.mjs, nommé par code point hexadécimal.",
    "",
  ].join("\n"),
);

console.log(`${written} tracés écrits dans public/strokes, ${missing.length} absents de la source : ${missing.join("")}`);
