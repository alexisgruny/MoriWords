import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("keeps internal paths with their query string", () => {
    expect(safeRedirectPath("/decks/abc?onglet=mots")).toBe("/decks/abc?onglet=mots");
    expect(safeRedirectPath(["/historique", "/decks"])).toBe("/historique");
  });

  it("falls back to the home page for anything else", () => {
    for (const value of [undefined, "", "decks", "https://evil.example", "//evil.example", "/\\evil.example"]) {
      expect(safeRedirectPath(value)).toBe("/");
    }
  });
});
