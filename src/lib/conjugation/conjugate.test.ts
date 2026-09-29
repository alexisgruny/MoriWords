import { describe, expect, it } from "vitest";

import { conjugationsOf } from "./conjugate";
import { conjugationForms } from "./forms";

describe("conjugationsOf", () => {
  it("conjugates godan, ichidan, irregular verbs and adjectives", () => {
    expect(conjugationsOf("書く", "かく")).toEqual(expect.arrayContaining(["書きます", "書かない", "書いて", "書いた", "書こう", "書ける"]));
    expect(conjugationsOf("行く", "いく")).toEqual(expect.arrayContaining(["行って", "行った"]));
    expect(conjugationsOf("飲む", "のむ")).toEqual(expect.arrayContaining(["飲んで", "飲まない", "飲みました"]));
    expect(conjugationsOf("食べる", "たべる")).toEqual(expect.arrayContaining(["食べます", "食べない", "食べて", "食べられる"]));
    expect(conjugationsOf("知る", "しる")).toEqual(expect.arrayContaining(["知らない", "知って"]));
    expect(conjugationsOf("見る", "みる")).toEqual(expect.arrayContaining(["見ない", "見て"]));
    expect(conjugationsOf("結婚する", "けっこんする")).toEqual(expect.arrayContaining(["結婚します", "結婚して"]));
    expect(conjugationsOf("来る")).toEqual(expect.arrayContaining(["来ます", "来ない"]));
    expect(conjugationsOf("高い", "たかい")).toEqual(expect.arrayContaining(["高くない", "高かった", "高くて"]));
    expect(conjugationsOf("いい")).toEqual(expect.arrayContaining(["よくない", "よかった"]));
    expect(conjugationsOf("静か", "しずか")).toEqual(expect.arrayContaining(["静かじゃない", "静かでした"]));
  });

  it("offers at least 3 other forms for every word of the conjugation reference", () => {
    for (const form of conjugationForms) {
      for (const example of form.examples) {
        const others = conjugationsOf(example.base, example.reading).filter((value) => value !== example.conjugated);
        expect(new Set(others).size, example.base).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
