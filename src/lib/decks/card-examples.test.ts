import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateJsonFromClaudeMock } = vi.hoisted(() => ({ generateJsonFromClaudeMock: vi.fn() }));

vi.mock("@/lib/feeds/claude-json-generator", () => ({
  generateJsonFromClaude: generateJsonFromClaudeMock,
}));

import { prisma } from "@/lib/db/prisma";
import { ExampleServiceError, generateExamples, tryGenerateExamples } from "./card-examples";

// Chaque lemme utilisé par un test ci-dessous : le cache par mot (voir
// card-examples.ts) est une vraie table, il faut donc la vider avant et
// après chaque test pour que deux tests sur le même mot (ou un autre
// fichier de test qui génère des exemples pour ce même mot, voir
// cards-examples.integration.test.ts) ne se marchent pas dessus. Choisis
// volontairement des mots que ce fichier est seul à faire générer avec
// succès (食べる/飲む/見る sont déjà pris par ce fichier-là).
const TEST_LEMMAS = ["読む", "猫", "泳ぐ"];

async function clearLemmaExampleCache() {
  await prisma.lemmaExampleCache.deleteMany({ where: { lemma: { in: TEST_LEMMAS } } });
}

beforeEach(clearLemmaExampleCache);

afterEach(async () => {
  vi.restoreAllMocks();
  generateJsonFromClaudeMock.mockReset();
  await clearLemmaExampleCache();
});

describe("generateExamples", () => {
  it("returns at most 5 trimmed examples from Claude's response", async () => {
    generateJsonFromClaudeMock.mockResolvedValue({
      examples: Array.from({ length: 7 }, (_, index) => ({
        japanese: ` 私は${index}を読みます 。 `,
        reading: ` わたしは${index}をよみます 。 `,
        translation: ` Je lis ${index}. `,
      })),
    });

    const examples = await generateExamples("読む");

    expect(examples).toHaveLength(5);
    expect(examples[0]).toEqual({
      japanese: "私は0を読みます 。",
      reading: "わたしは0をよみます 。",
      translation: "Je lis 0.",
    });
  });

  it("allows a missing reading", async () => {
    generateJsonFromClaudeMock.mockResolvedValue({
      examples: [{ japanese: "猫がいます。", translation: "Il y a un chat." }],
    });

    const examples = await generateExamples("猫");

    expect(examples[0].reading).toBeNull();
  });

  it("propagates a service error", async () => {
    generateJsonFromClaudeMock.mockRejectedValue(new ExampleServiceError("panne"));

    await expect(generateExamples("猫")).rejects.toThrow(ExampleServiceError);
  });
});

describe("tryGenerateExamples", () => {
  it("never throws: returns null when generation fails", async () => {
    generateJsonFromClaudeMock.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(tryGenerateExamples("猫")).resolves.toBeNull();
  });
});

describe("generateExamples caching", () => {
  it("caches examples per lemma and reuses them without calling Claude again", async () => {
    generateJsonFromClaudeMock.mockResolvedValue({
      examples: [{ japanese: "海で泳ぐ。", reading: "うみでおよぐ。", translation: "Nager dans la mer." }],
    });

    const first = await generateExamples("泳ぐ");
    expect(generateJsonFromClaudeMock).toHaveBeenCalledTimes(1);

    generateJsonFromClaudeMock.mockClear();

    const second = await generateExamples("泳ぐ");
    expect(second).toEqual(first);
    expect(generateJsonFromClaudeMock).not.toHaveBeenCalled();
  });
});
