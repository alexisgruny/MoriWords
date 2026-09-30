// Extraction des répliques japonaises d'un fichier de sous-titres (.srt,
// .vtt, .ass/.ssa), pour les analyser avant de regarder un épisode. Tout se
// fait dans le navigateur : le fichier vient de l'utilisateur et n'est
// jamais stocké tel quel.

const JAPANESE = /[぀-ヿ㐀-鿿]/;
const TIMECODE = /^\s*\d{1,2}:\d{2}(:\d{2})?[.,]\d{1,3}\s*-->/;

export type ParsedSubtitles = { text: string; lineCount: number; truncated: boolean };

// Texte d'une ligne de dialogue .ass : après le 9e champ (Layer, Start, End,
// Style, Name, MarginL, MarginR, MarginV, Effect).
function assDialogueText(line: string): string | null {
  const match = /^Dialogue:\s*(.*)$/i.exec(line);
  if (!match) {
    return null;
  }
  const fields = match[1].split(",");
  return fields.length >= 10 ? fields.slice(9).join(",") : null;
}

function cleanLine(line: string): string {
  return line
    .replace(/\{[^}]*\}/g, "") // balises .ass ({\an8}, {\i1}…)
    .replace(/<[^>]+>/g, "") // balises HTML (<i>, <font>…)
    .replace(/\\[Nn]/g, "\n")
    .replace(/\\h/g, " ")
    .trim();
}

export function parseSubtitles(content: string, maxLength: number): ParsedSubtitles {
  const isAss = /^\s*\[Script Info\]/im.test(content) || /^Dialogue:/im.test(content);
  const rawLines = content.replace(/^﻿/, "").split(/\r?\n/);

  const texts: string[] = [];
  for (const raw of rawLines) {
    let line: string | null;
    if (isAss) {
      line = assDialogueText(raw);
    } else {
      // .srt / .vtt : on saute numéros de réplique, minutages, en-têtes.
      const trimmed = raw.trim();
      line = /^\d+$/.test(trimmed) || TIMECODE.test(trimmed) || /^(WEBVTT|NOTE|STYLE|REGION)\b/.test(trimmed) ? null : raw;
    }
    if (line === null) {
      continue;
    }
    for (const part of cleanLine(line).split("\n")) {
      const text = part.trim();
      // Lignes sans japonais (traduction, crédits, ♪) écartées ; répétitions
      // consécutives (même réplique sur deux sous-titres) fusionnées.
      if (text && JAPANESE.test(text) && texts.at(-1) !== text) {
        texts.push(text);
      }
    }
  }

  // Coupe à la limite d'analyse, sans couper une réplique en deux.
  const kept: string[] = [];
  let length = 0;
  for (const text of texts) {
    if (length + text.length + 1 > maxLength) {
      break;
    }
    kept.push(text);
    length += text.length + 1;
  }
  return { text: kept.join("\n"), lineCount: kept.length, truncated: kept.length < texts.length };
}

// Beaucoup de sous-titres japonais sont en Shift-JIS : si l'UTF-8 donne des
// caractères de remplacement, on relit le fichier dans cet encodage.
export function decodeSubtitleFile(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (!utf8.includes("�")) {
    return utf8;
  }
  try {
    return new TextDecoder("shift_jis").decode(buffer);
  } catch {
    return utf8;
  }
}
