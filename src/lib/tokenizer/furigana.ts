import type { TokenResult } from "./types";

const HAS_KANJI = /\p{Script=Han}/u;

const toHiragana = (value: string) =>
  value.replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));

export type TextSegment = { text: string; token?: TokenResult };

// Replace les mots analysés dans le texte d'origine, dans l'ordre : ce qui
// se trouve entre deux mots (ponctuation, espaces, retours à la ligne, que
// l'analyse ne renvoie pas) reste en texte simple. Un mot introuvable (texte
// modifié depuis l'analyse) est ignoré plutôt que de décaler tout le reste.
export function segmentText(text: string, tokens: TokenResult[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const token of tokens) {
    const index = text.indexOf(token.surface, cursor);
    if (index < 0 || !token.surface) {
      continue;
    }
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index) });
    }
    segments.push({ text: token.surface, token });
    cursor = index + token.surface.length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments;
}

export type FuriganaPart = { text: string; ruby?: string };

// Furigana d'un mot : seulement au-dessus de la partie en kanji (食べる →
// 食[た]べる, pas たべる au-dessus de tout le mot). Les kana en tête et en fin
// de mot, identiques dans l'écriture et la lecture, restent sans furigana.
export function furiganaParts(surface: string, reading?: string | null): FuriganaPart[] {
  if (!reading || !HAS_KANJI.test(surface)) {
    return [{ text: surface }];
  }

  const written = [...surface];
  const heard = [...reading];
  const writtenKana = written.map(toHiragana);

  let start = 0;
  while (start < written.length && start < heard.length && !HAS_KANJI.test(written[start]) && writtenKana[start] === heard[start]) {
    start += 1;
  }

  let writtenEnd = written.length;
  let heardEnd = heard.length;
  while (
    writtenEnd > start &&
    heardEnd > start &&
    !HAS_KANJI.test(written[writtenEnd - 1]) &&
    writtenKana[writtenEnd - 1] === heard[heardEnd - 1]
  ) {
    writtenEnd -= 1;
    heardEnd -= 1;
  }

  const parts: FuriganaPart[] = [];
  if (start > 0) {
    parts.push({ text: written.slice(0, start).join("") });
  }
  parts.push({ text: written.slice(start, writtenEnd).join(""), ruby: heard.slice(start, heardEnd).join("") });
  if (writtenEnd < written.length) {
    parts.push({ text: written.slice(writtenEnd).join("") });
  }
  return parts;
}
