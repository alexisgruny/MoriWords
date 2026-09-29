import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { WRITABLE_KANA, isWritingSuccess, strokeDataUrl } from "./writing";

const strokeCount = (character: string): number => {
  const file = path.join(process.cwd(), "public", strokeDataUrl(character));
  return (JSON.parse(fs.readFileSync(file, "utf8")) as { strokes: string[] }).strokes.length;
};

describe("writing", () => {
  it("names stroke files by hexadecimal code point", () => {
    expect(strokeDataUrl("あ")).toBe("/strokes/3042.json");
    expect(strokeDataUrl("食")).toBe("/strokes/98df.json");
  });

  it("counts a character as written only without help and with at most one mistake", () => {
    expect(isWritingSuccess({ mistakes: 1, assisted: false })).toBe(true);
    expect(isWritingSuccess({ mistakes: 2, assisted: false })).toBe(false);
    expect(isWritingSuccess({ mistakes: 0, assisted: true })).toBe(false);
  });

  it("has a stroke file for every writable kana, with the split loops merged back", () => {
    expect(WRITABLE_KANA).toHaveLength(142);
    // Kana à boucle que la source découpait en plus de morceaux que de traits.
    expect(strokeCount("あ")).toBe(3);
    expect(strokeCount("ぬ")).toBe(2);
    expect(strokeCount("の")).toBe(1);
    expect(strokeCount("ぱ")).toBe(4);
    for (const entry of WRITABLE_KANA) {
      expect(strokeCount(entry.kana)).toBeGreaterThan(0);
    }
  });

  it("has a stroke file for every JLPT kanji, with its standard stroke count", () => {
    // 衷 : un trait découpé en deux dans la source (tolérance connue).
    const mismatches = JLPT_KANJI.filter((entry) => strokeCount(entry.kanji) !== entry.strokeCount).map((entry) => entry.kanji);
    expect(mismatches).toEqual(["衷"]);
  });
});
