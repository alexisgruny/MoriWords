import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    translationCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { translateText } from "./translate";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.mocked(prisma.translationCache.findUnique).mockReset();
  vi.mocked(prisma.translationCache.upsert).mockReset();
});

describe("translateText", () => {
  it("returns a safe fallback when no Anthropic API key is configured", async () => {
    const result = await translateText("私", "ja", "fr");

    expect(result).toMatchObject({
      translation: "À compléter",
      explanation: expect.stringContaining("Anthropic"),
    });
  });

  it("calls Anthropic and parses the translated payload when the API key is configured", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                translation: "moi",
                explanation: "Le mot 私 signifie ‘moi’ ou ‘je’ selon le contexte.",
              }),
            },
          ],
        }),
      }),
    );
    vi.mocked(prisma.translationCache.upsert).mockResolvedValue({
      id: "cache-1",
      lemma: "私",
      sourceLanguage: "ja",
      targetLanguage: "fr",
      translation: "moi",
      explanation: "Le mot 私 signifie ‘moi’ ou ‘je’ selon le contexte.",
      difficulty: "N5",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await translateText("私", "ja", "fr");

    expect(result).toEqual({
      translation: "moi",
      explanation: "Le mot 私 signifie ‘moi’ ou ‘je’ selon le contexte.",
      difficulty: "N5",
    });
    expect(prisma.translationCache.upsert).toHaveBeenCalled();
  });

  it("uses a cached translation when the lemma already exists", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue({
      id: "cache-1",
      lemma: "私",
      sourceLanguage: "ja",
      targetLanguage: "fr",
      translation: "moi",
      explanation: "Déjà en cache",
      difficulty: "N5",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await translateText("私", "ja", "fr");

    expect(result).toEqual({
      translation: "moi",
      explanation: "Déjà en cache",
      difficulty: "N5",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("parses a markdown-wrapped JSON response from Anthropic", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: "```json\n{\"translation\":\"moi\",\"explanation\":\"Le mot 私 signifie ‘moi’.\"}\n```",
            },
          ],
        }),
      }),
    );
    vi.mocked(prisma.translationCache.upsert).mockResolvedValue({
      id: "cache-2",
      lemma: "私",
      sourceLanguage: "ja",
      targetLanguage: "fr",
      translation: "moi",
      explanation: "Le mot 私 signifie ‘moi’.",
      difficulty: "N5",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await translateText("私", "ja", "fr");

    expect(result).toEqual({
      translation: "moi",
      explanation: "Le mot 私 signifie ‘moi’.",
      difficulty: "N5",
    });
  });

  it("parses the correct JSON object when Anthropic emits multiple JSON snippets in one text block", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: `Voici la réponse finale : \n\n\`\`\`json\n{"translation":"moi","explanation":"Le mot 私 signifie ‘moi’."}\n\`\`\`\n\nAutre tentative : \n\n\`\`\`json\n{"translation":"je","explanation":"Le mot 私 peut aussi être traduit par ‘je’."}\n\`\`\`
`,
            },
          ],
        }),
      }),
    );
    vi.mocked(prisma.translationCache.upsert).mockResolvedValue({
      id: "cache-3",
      lemma: "私",
      sourceLanguage: "ja",
      targetLanguage: "fr",
      translation: "moi",
      explanation: "Le mot 私 signifie ‘moi’.",
      difficulty: "N5",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await translateText("私", "ja", "fr");

    expect(result).toEqual({
      translation: "moi",
      explanation: "Le mot 私 signifie ‘moi’.",
      difficulty: "N5",
    });
  });

  it("parses an object using single quotes when Anthropic does not return strict JSON", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: "{'translation': 'moi', 'explanation': 'Le mot 私 signifie moi.'}",
            },
          ],
        }),
      }),
    );
    vi.mocked(prisma.translationCache.upsert).mockResolvedValue({
      id: "cache-4",
      lemma: "私",
      sourceLanguage: "ja",
      targetLanguage: "fr",
      translation: "moi",
      explanation: "Le mot 私 signifie moi.",
      difficulty: "N5",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(translateText("私", "ja", "fr")).resolves.toEqual({
      translation: "moi",
      explanation: "Le mot 私 signifie moi.",
      difficulty: "N5",
    });
  });
});
