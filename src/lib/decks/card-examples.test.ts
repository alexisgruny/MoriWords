import { afterEach, describe, expect, it, vi } from "vitest";

const { generateJsonFromClaudeMock } = vi.hoisted(() => ({ generateJsonFromClaudeMock: vi.fn() }));

vi.mock("@/lib/feeds/claude-json-generator", () => ({
  generateJsonFromClaude: generateJsonFromClaudeMock,
}));

import { ExampleServiceError, generateExamples, tryGenerateExamples } from "./card-examples";

afterEach(() => {
  vi.restoreAllMocks();
  generateJsonFromClaudeMock.mockReset();
});

describe("generateExamples", () => {
  it("returns at most 5 trimmed examples from Claude's response", async () => {
    generateJsonFromClaudeMock.mockResolvedValue({
      examples: Array.from({ length: 7 }, (_, index) => ({
        japanese: ` 私は${index}を食べます 。 `,
        reading: ` わたしは${index}をたべます 。 `,
        translation: ` Je mange ${index}. `,
      })),
    });

    const examples = await generateExamples("食べる");

    expect(examples).toHaveLength(5);
    expect(examples[0]).toEqual({
      japanese: "私は0を食べます 。",
      reading: "わたしは0をたべます 。",
      translation: "Je mange 0.",
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
