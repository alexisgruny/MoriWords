import { describe, expect, it } from "vitest";

import { classifyDifficulty, type JLPTLevel } from "./classify";

describe("classifyDifficulty", () => {
  it("classifie les mots courants en N5", () => {
    expect(classifyDifficulty("私", "わたし", "代名詞")).toBe<JLPTLevel>("N5");
    expect(classifyDifficulty("食べる", "たべる", "動詞")).toBe<JLPTLevel>("N5");
  });

  it("classifie les mots plus avancés en N3 et au-dessus", () => {
    expect(classifyDifficulty("企業", "きぎょう", "名詞")).toBe<JLPTLevel>("N3");
    expect(classifyDifficulty("概念", "がいねん", "名詞")).toBe<JLPTLevel>("N1");
    expect(classifyDifficulty("弁証法", "べんしょうほう", "名詞")).toBe<JLPTLevel>("unknown");
  });

  it("retourne unknown pour un mot absent du dataset", () => {
    expect(classifyDifficulty("未知語", "みちご", "名詞")).toBe<JLPTLevel>("unknown");
  });
});
