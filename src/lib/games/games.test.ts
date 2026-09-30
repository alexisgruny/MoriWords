import { describe, expect, it } from "vitest";

import { WORD_LEVELS } from "@/lib/difficulty/classify";
import { findUnknownWords } from "@/lib/spellcheck/check-french";
import { buildCrossword, solutionCells, wordCells } from "./crossword";
import { PARTICLE_SENTENCES } from "./particles";
import { checkPlayerMove, computerMove, endsWithN, lastKana } from "./shiritori";
import { GAME_WORDS } from "./words";

describe("mots des mini-jeux", () => {
  it("are all N5 words, without duplicates", () => {
    // ご飯 est rangé sous 御飯 dans les listes JLPT.
    const isN5 = (word: { kana: string; written: string }) =>
      [word.written, word.written.replace("ご飯", "御飯"), word.kana].some((key) => WORD_LEVELS[key] === "N5");
    const notN5 = GAME_WORDS.filter((word) => !isN5(word));
    expect(notN5.map((word) => `${word.written} (${word.kana})`)).toEqual([]);
    expect(new Set(GAME_WORDS.map((word) => word.kana)).size).toBe(GAME_WORDS.length);
  });

  it("have French meanings without spelling mistakes", () => {
    expect(GAME_WORDS.flatMap((word) => findUnknownWords(word.fr))).toEqual([]);
  });
});

describe("shiritori", () => {
  it("uses the last kana, ignoring ー and enlarging small kana", () => {
    expect(lastKana("コーヒー")).toBe("ひ");
    expect(lastKana("でんしゃ")).toBe("や");
    expect(lastKana("ねこ")).toBe("こ");
    expect(endsWithN("ほん")).toBe(true);
  });

  it("checks the player's word", () => {
    const used = new Set(["ねこ"]);
    expect(checkPlayerMove("こども", "ねこ", used)).toMatchObject({ ok: true });
    expect(checkPlayerMove("いぬ", "ねこ", used)).toEqual({ ok: false, reason: "lettre" });
    expect(checkPlayerMove("こんぴゅーた", "ねこ", used)).toEqual({ ok: false, reason: "inconnu" });
    expect(checkPlayerMove("ねこ", "あね", used)).toEqual({ ok: false, reason: "deja" });
  });

  it("makes the computer avoid words ending in ん", () => {
    const move = computerMove("ねこ", new Set(), (words) => words[0]);
    expect(move).not.toBeNull();
    expect(endsWithN(move?.kana ?? "")).toBe(false);
  });
});

describe("mots croisés", () => {
  it("builds a consistent grid with crossings", () => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const crossword = buildCrossword(random);
    expect(crossword.words.length).toBeGreaterThanOrEqual(4);
    // Une lettre par case même là où deux mots se croisent.
    const cells = new Map<string, string>();
    for (const placed of crossword.words) {
      wordCells(placed).forEach((cell, index) => {
        const letter = [...placed.word.kana][index];
        expect(cells.get(cell) ?? letter).toBe(letter);
        cells.set(cell, letter);
      });
    }
    expect(solutionCells(crossword).size).toBe(cells.size);
    const total = crossword.words.reduce((sum, placed) => sum + placed.word.kana.length, 0);
    expect(cells.size).toBeLessThan(total);
  });
});

describe("particules", () => {
  it("never lists the answer among the wrong choices", () => {
    for (const sentence of PARTICLE_SENTENCES) {
      expect(sentence.wrong).not.toContain(sentence.answer);
      expect(new Set(sentence.wrong).size).toBe(3);
    }
    expect(PARTICLE_SENTENCES.flatMap((sentence) => findUnknownWords(sentence.fr))).toEqual([]);
  });
});
