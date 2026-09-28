import { describe, expect, it } from "vitest";

import { findUnknownWords } from "./check-french";

describe("findUnknownWords", () => {
  it("finds nothing in correctly spelled French", () => {
    expect(findUnknownWords("Ceci est une phrase correcte en français.")).toEqual([]);
  });

  it("flags a misspelled word", () => {
    expect(findUnknownWords("Ceci est une phrasee incorrecte.")).toEqual(["phrasee"]);
  });

  it("flags a made-up word", () => {
    expect(findUnknownWords("Un mot inexistant : flibberflop.")).toEqual(["flibberflop"]);
  });

  it("ignores Japanese characters and JLPT levels", () => {
    expect(findUnknownWords("Le mot 食べる (niveau N5) veut dire manger.")).toEqual([]);
  });

  it("does not flag words from the allowlist", () => {
    expect(findUnknownWords("Le godan et l'ichidan sont deux groupes de verbes en JLPT.")).toEqual([]);
  });

  it("keeps a hyphenated or accented romanization together as one word", () => {
    expect(findUnknownWords("Écrit par Natsume Sōseki.")).toEqual([]);
  });
});
