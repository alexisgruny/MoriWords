import { describe, expect, it } from "vitest";

import { GRAMMAR_LEVELS, filterGrammarPoints, grammarPoints } from "./points";

describe("grammarPoints dataset", () => {
  it("has unique ids", () => {
    const ids = grammarPoints.map((point) => point.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every JLPT level with several points", () => {
    for (const level of GRAMMAR_LEVELS) {
      expect(grammarPoints.filter((point) => point.level === level).length).toBeGreaterThanOrEqual(10);
    }
  });

  it("gives every point a pattern, meaning, explanation and at least two examples", () => {
    for (const point of grammarPoints) {
      expect(point.pattern.trim(), point.id).not.toBe("");
      expect(point.meaning.trim(), point.id).not.toBe("");
      expect(point.explanation.trim(), point.id).not.toBe("");
      expect(point.examples.length, point.id).toBeGreaterThanOrEqual(2);
      for (const example of point.examples) {
        expect(example.ja.trim(), point.id).not.toBe("");
        expect(example.fr.trim(), point.id).not.toBe("");
      }
    }
  });

  it("prefixes each id with its level", () => {
    for (const point of grammarPoints) {
      expect(point.id.startsWith(point.level.toLowerCase() + "-"), point.id).toBe(true);
    }
  });
});

describe("filterGrammarPoints", () => {
  it("returns every point for level 'all' and an empty query", () => {
    expect(filterGrammarPoints(grammarPoints, "all", "")).toHaveLength(grammarPoints.length);
  });

  it("filters by level", () => {
    const n3 = filterGrammarPoints(grammarPoints, "N3", "");
    expect(n3.length).toBeGreaterThan(0);
    expect(n3.every((point) => point.level === "N3")).toBe(true);
  });

  it("searches pattern text", () => {
    const results = filterGrammarPoints(grammarPoints, "all", "ながら");
    expect(results.map((point) => point.id)).toContain("n4-nagara");
  });

  it("searches French text ignoring accents and case", () => {
    const results = filterGrammarPoints(grammarPoints, "all", "PARCE QUE");
    expect(results.map((point) => point.id)).toContain("n5-kara");
    const accented = filterGrammarPoints(grammarPoints, "all", "déjà");
    expect(accented.length).toBeGreaterThan(0);
  });

  it("combines level and query", () => {
    const results = filterGrammarPoints(grammarPoints, "N5", "ながら");
    expect(results).toHaveLength(0);
  });
});
