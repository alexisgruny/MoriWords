import { describe, expect, it } from "vitest";

import { GRAMMAR_LEVELS } from "@/lib/grammar/points";

import { conjugationForms, filterConjugationForms } from "./forms";

describe("conjugationForms dataset", () => {
  it("has unique ids", () => {
    const ids = conjugationForms.map((form) => form.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every JLPT level with at least one form", () => {
    for (const level of GRAMMAR_LEVELS) {
      expect(conjugationForms.filter((form) => form.level === level).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("gives every form a category, name, formation, explanation and at least one example", () => {
    for (const form of conjugationForms) {
      expect(form.category.trim(), form.id).not.toBe("");
      expect(form.name.trim(), form.id).not.toBe("");
      expect(form.formation.trim(), form.id).not.toBe("");
      expect(form.explanation.trim(), form.id).not.toBe("");
      expect(form.examples.length, form.id).toBeGreaterThanOrEqual(1);
      for (const example of form.examples) {
        expect(example.base.trim(), form.id).not.toBe("");
        expect(example.conjugated.trim(), form.id).not.toBe("");
        expect(example.meaning.trim(), form.id).not.toBe("");
      }
    }
  });

  it("prefixes each id with its level", () => {
    for (const form of conjugationForms) {
      expect(form.id.startsWith(form.level.toLowerCase() + "-"), form.id).toBe(true);
    }
  });
});

describe("filterConjugationForms", () => {
  it("returns every form for level 'all' and an empty query", () => {
    expect(filterConjugationForms(conjugationForms, "all", "")).toHaveLength(conjugationForms.length);
  });

  it("filters by level", () => {
    const n4 = filterConjugationForms(conjugationForms, "N4", "");
    expect(n4.length).toBeGreaterThan(0);
    expect(n4.every((form) => form.level === "N4")).toBe(true);
  });

  it("searches the form name", () => {
    const results = filterConjugationForms(conjugationForms, "all", "potentielle");
    expect(results.map((form) => form.id)).toContain("n4-potential");
  });

  it("searches French text ignoring accents and case", () => {
    const results = filterConjugationForms(conjugationForms, "all", "HONORIFIQUE");
    expect(results.length).toBeGreaterThan(0);
    const accented = filterConjugationForms(conjugationForms, "all", "degradé".normalize("NFD"));
    expect(accented).toEqual([]);
  });

  it("combines level and query", () => {
    const results = filterConjugationForms(conjugationForms, "N5", "adjectif");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((form) => form.level === "N5")).toBe(true);
  });
});
