// Vraie DB Postgres pour les exercices, Claude mocké : un QCM ne doit jamais l'appeler.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { testUser, generateJsonFromClaudeMock } = vi.hoisted(() => ({
  testUser: { id: "", email: "" },
  generateJsonFromClaudeMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireUser: async () => testUser }));
vi.mock("@/lib/feeds/claude-json-generator", () => ({ generateJsonFromClaude: generateJsonFromClaudeMock }));

import { createTestUser, deleteTestUser } from "@/lib/auth/test-user";
import { prisma } from "@/lib/db/prisma";
import { conjugationForms } from "@/lib/conjugation/forms";
import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { POST as correct } from "@/app/api/grammar/exercises/correct/route";
import { buildChoices, correctChoice } from "./choices";
import { grammarPoints } from "./points";

// La première découpe en mots charge le dictionnaire japonais (kuromoji) :
// plusieurs secondes quand toute la suite de tests tourne en parallèle.
vi.setConfig({ testTimeout: 30_000 });

beforeAll(async () => {
  Object.assign(testUser, await createTestUser("choices"));
});

afterAll(async () => {
  await deleteTestUser(testUser.id);
  await prisma.$disconnect();
});

describe("buildChoices", () => {
  it("offers the grammar reference among 4 sentences of the same level", async () => {
    const point = grammarPoints.find((candidate) => candidate.level === "N5")!;
    const choices = (await buildChoices(`static:${point.id}:0`, testUser.id))!;

    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    expect(choices).toContain(point.examples[0].ja);
    const sameLevel = new Set(grammarPoints.filter((p) => p.level === "N5").flatMap((p) => p.examples.map((e) => e.ja)));
    expect(choices.every((choice) => sameLevel.has(choice))).toBe(true);
  });

  it("uses other forms of the same verb as conjugation distractors", async () => {
    const form = conjugationForms.find((candidate) => candidate.id === "n5-te-form")!;
    const index = form.examples.findIndex((example) => example.base === "食べる");
    const choices = (await buildChoices(`conj:${form.id}:${index}`, testUser.id))!;

    expect(choices).toContain(form.examples[index].conjugated);
    expect(choices).toHaveLength(4);
    expect(choices.every((choice) => choice.startsWith("食べ"))).toBe(true);
  });

  it("always offers exactly 4 distinct choices for every conjugation example", async () => {
    for (const form of conjugationForms) {
      for (let index = 0; index < form.examples.length; index += 1) {
        const choices = (await buildChoices(`conj:${form.id}:${index}`, testUser.id))!;
        expect(new Set(choices).size, `${form.id}:${index} ${choices.join(" / ")}`).toBe(4);
        expect(choices, form.id).toContain(form.examples[index].conjugated);
      }
    }
  });

  it("keeps the same word in all 4 choices even for a word seen in a single form", async () => {
    const form = conjugationForms.find((candidate) => candidate.examples.some((example) => example.base === "知る"))!;
    const index = form.examples.findIndex((example) => example.base === "知る");
    const choices = (await buildChoices(`conj:${form.id}:${index}`, testUser.id))!;

    expect(choices).toHaveLength(4);
    expect(choices.every((choice) => choice.startsWith("知"))).toBe(true);
  });

  it("offers one reading of the kanji and readings of other kanji in the same script", async () => {
    const entry = JLPT_KANJI.find((candidate) => candidate.kanji === "食")!;
    const readings = [...entry.onReadings, ...entry.kunReadings].map((reading) => reading.replace(/[.-]/g, ""));
    const choices = (await buildChoices("kanji-yomi:食", testUser.id))!;

    const own = choices.filter((choice) => readings.includes(choice));
    expect(own).toHaveLength(1);
    const katakana = /^[\u30a0-\u30ff]+$/.test(own[0]);
    expect(choices.every((choice) => /^[\u30a0-\u30ff]+$/.test(choice) === katakana)).toBe(true);
  });

  it("offers the kanji meaning among meanings of other kanji", async () => {
    const choices = (await buildChoices("kanji:食", testUser.id))!;
    expect(choices).toContain(JLPT_KANJI.find((candidate) => candidate.kanji === "食")!.meaning);
    expect(choices).toHaveLength(4);
  });
});

describe("choice correction", () => {
  it("corrects locally, without Claude, even a wrong choice", async () => {
    const point = grammarPoints.find((candidate) => candidate.level === "N5")!;
    const other = grammarPoints.find((candidate) => candidate.level === "N5" && candidate.id !== point.id)!;
    const request = (answer: string) =>
      new Request("http://localhost/api/grammar/exercises/correct", {
        method: "POST",
        body: JSON.stringify({ exerciseId: `static:${point.id}:0`, answer, format: "choice" }),
      });

    const wrong = (await (await correct(request(other.examples[0].ja))).json()) as { correction: { verdict: string } };
    const right = (await (await correct(request(point.examples[0].ja))).json()) as { correction: { verdict: string } };

    expect(wrong.correction.verdict).toBe("incorrect");
    expect(right.correction.verdict).toBe("correct");
    expect(generateJsonFromClaudeMock).not.toHaveBeenCalled();
  });

  it("accepts any displayed reading for a kanji reading question", () => {
    expect(correctChoice({ exerciseId: "kanji-yomi:食", reference: "ショク・た.べる", answer: "たべる" }).verdict).toBe("correct");
    expect(correctChoice({ exerciseId: "kanji-yomi:食", reference: "ショク・た.べる", answer: "のむ" }).verdict).toBe("incorrect");
  });
});
