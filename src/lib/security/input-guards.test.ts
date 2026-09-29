import { describe, expect, it } from "vitest";

import { isCrossSiteWrite } from "@/lib/auth/session";
import { boundedStringList, MAX_TOKENS_PER_TEXT, optionalText } from "./input-limits";
import { parseTokenList } from "./token-payload";

const token = (overrides: Record<string, unknown> = {}) => ({
  surface: "猫",
  baseForm: "猫",
  reading: "ネコ",
  partOfSpeech: "名詞",
  difficulty: "N5",
  position: 0,
  ...overrides,
});

describe("parseTokenList", () => {
  it("accepts a normal analysis", () => {
    expect(parseTokenList([token(), token({ surface: "が", partOfSpeech: "助詞", position: 1 })])).toHaveLength(2);
  });

  it("refuses empty, oversized or malformed lists", () => {
    expect(parseTokenList([])).toBeNull();
    expect(parseTokenList("nope")).toBeNull();
    expect(parseTokenList(Array.from({ length: MAX_TOKENS_PER_TEXT + 1 }, (_, i) => token({ position: i % 100 })))).toBeNull();
    expect(parseTokenList([token({ surface: 42 })])).toBeNull();
    expect(parseTokenList([token({ surface: "x".repeat(101) })])).toBeNull();
    expect(parseTokenList([token({ position: -1 })])).toBeNull();
    expect(parseTokenList([token({ difficulty: "N0" })])).toBeNull();
  });
});

describe("boundedStringList and optionalText", () => {
  it("keeps only short strings, up to the limit", () => {
    expect(boundedStringList(["a", 1, "", "b", "x".repeat(300)], 10)).toEqual(["a", "b"]);
    expect(boundedStringList(Array.from({ length: 2000 }, (_, i) => `id-${i}`))).toHaveLength(500);
    expect(boundedStringList({ not: "a list" })).toEqual([]);
  });

  it("tells absent, cleared, valid and invalid values apart", () => {
    expect(optionalText(undefined, 10)).toBeUndefined();
    expect(optionalText(null, 10)).toBeNull();
    expect(optionalText("  ", 10)).toBeNull();
    expect(optionalText(" chat ", 10)).toBe("chat");
    expect(optionalText(42, 10)).toBe("invalid");
    expect(optionalText("x".repeat(11), 10)).toBe("invalid");
  });
});

describe("isCrossSiteWrite", () => {
  const request = (method: string, headers: Record<string, string>) =>
    new Request("https://moriwords.vercel.app/api/decks", { method, headers });

  it("refuses a change coming from another site", () => {
    expect(isCrossSiteWrite(request("POST", { origin: "https://evil.example" }))).toBe(true);
    expect(isCrossSiteWrite(request("DELETE", { "sec-fetch-site": "cross-site" }))).toBe(true);
  });

  it("lets through the site's own changes, reads and server-side calls", () => {
    expect(isCrossSiteWrite(request("POST", { origin: "https://moriwords.vercel.app" }))).toBe(false);
    expect(isCrossSiteWrite(request("GET", { origin: "https://evil.example" }))).toBe(false);
    expect(isCrossSiteWrite(request("PATCH", {}))).toBe(false);
  });
});
