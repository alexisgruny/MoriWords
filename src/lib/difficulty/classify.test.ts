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

  it("distingue N4 de N5 (le dataset source les fusionne)", () => {
    expect(classifyDifficulty("必要", "ひつよう", "名詞")).toBe<JLPTLevel>("N4");
    expect(classifyDifficulty("関係", "かんけい", "名詞")).toBe<JLPTLevel>("N4");
    expect(classifyDifficulty("経験", "けいけん", "名詞")).toBe<JLPTLevel>("N4");
  });

  it("classifie aussi des mots N2", () => {
    expect(classifyDifficulty("状況", "じょうきょう", "名詞")).toBe<JLPTLevel>("N2");
    expect(classifyDifficulty("政府", "せいふ", "名詞")).toBe<JLPTLevel>("N2");
  });

  it("ne confond pas un auxiliaire avec un mot de même lecture (ます ≠ 増す)", () => {
    expect(classifyDifficulty("増す", "ます", "動詞")).toBe<JLPTLevel>("N1");
    expect(classifyDifficulty("ます", "ます", "助動詞")).toBe<JLPTLevel>("unknown");
    expect(classifyDifficulty("です", "です", "助動詞")).toBe<JLPTLevel>("unknown");
  });

  it("retrouve un mot écrit en kanji mais listé en kana par son écriture en kana", () => {
    expect(classifyDifficulty("下さい", "ください", "動詞")).not.toBe<JLPTLevel>("unknown");
  });

  it("retourne unknown pour un mot absent du dataset", () => {
    expect(classifyDifficulty("未知語", "みちご", "名詞")).toBe<JLPTLevel>("unknown");
  });
});
