import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { messagesCreateMock } = vi.hoisted(() => ({ messagesCreateMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();

  class MockAnthropic {
    messages = { create: messagesCreateMock };
  }

  // Les classes d'erreur (APIError, APIConnectionTimeoutError, ...) sont des statiques
  // héritées de BaseAnthropic, pas des propriétés propres à Anthropic : Object.assign ne
  // les copierait pas. On relie la chaîne de prototype statique pour les garder accessibles
  // sur le client mocké, puisque translate.ts fait `instanceof Anthropic.XError`.
  Object.setPrototypeOf(MockAnthropic, actual.default);

  return { ...actual, default: MockAnthropic };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    translationCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import Anthropic from "@anthropic-ai/sdk";

import { prisma } from "@/lib/db/prisma";
import { TranslationServiceError, getDistractorTranslations, translateText } from "./translate";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.mocked(prisma.translationCache.findUnique).mockReset();
  vi.mocked(prisma.translationCache.upsert).mockReset();
  vi.mocked(prisma.translationCache.count).mockReset();
  vi.mocked(prisma.translationCache.findMany).mockReset();
  messagesCreateMock.mockReset();
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

    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            translation: "moi",
            explanation: "Le mot 私 signifie ‘moi’ ou ‘je’ selon le contexte.",
          }),
        },
      ],
    });
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

    const result = await translateText("私", "ja", "fr");

    expect(result).toEqual({
      translation: "moi",
      explanation: "Déjà en cache",
      difficulty: "N5",
    });
    expect(messagesCreateMock).not.toHaveBeenCalled();
  });

  it("parses a markdown-wrapped JSON response from Anthropic", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "```json\n{\"translation\":\"moi\",\"explanation\":\"Le mot 私 signifie ‘moi’.\"}\n```",
        },
      ],
    });
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

    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: `Voici la réponse finale : \n\n\`\`\`json\n{"translation":"moi","explanation":"Le mot 私 signifie ‘moi’."}\n\`\`\`\n\nAutre tentative : \n\n\`\`\`json\n{"translation":"je","explanation":"Le mot 私 peut aussi être traduit par ‘je’."}\n\`\`\`
`,
        },
      ],
    });
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

    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "{'translation': 'moi', 'explanation': 'Le mot 私 signifie moi.'}",
        },
      ],
    });
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

  it("throws a clear timeout error when Anthropic does not respond in time", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    messagesCreateMock.mockRejectedValue(new Anthropic.APIConnectionTimeoutError({}));

    await expect(translateText("私", "ja", "fr")).rejects.toThrow(TranslationServiceError);
    await expect(translateText("私", "ja", "fr")).rejects.toThrow(
      "Le service de traduction met trop de temps à répondre. Réessaie dans un instant.",
    );
  });

  it("throws a generic error without leaking the raw Anthropic error body", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    messagesCreateMock.mockRejectedValue(
      new Anthropic.APIError(500, undefined, "sensitive upstream detail", undefined),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(translateText("私", "ja", "fr")).rejects.toThrow(TranslationServiceError);
    await expect(translateText("私", "ja", "fr")).rejects.toThrow(
      "Le service de traduction est momentanément indisponible. Réessaie plus tard.",
    );
  });

  it("skips the cache and sends the surrounding sentence when a context is given", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            translation: "je",
            explanation: "Dans cette phrase, 私 est utilisé comme sujet et signifie ‘je’.",
          }),
        },
      ],
    });

    const result = await translateText("私", "ja", "fr", "私は毎朝コーヒーを飲みます。");

    expect(result).toEqual({
      translation: "je",
      explanation: "Dans cette phrase, 私 est utilisé comme sujet et signifie ‘je’.",
      difficulty: "N5",
    });
    expect(prisma.translationCache.findUnique).not.toHaveBeenCalled();
    expect(prisma.translationCache.upsert).not.toHaveBeenCalled();

    const requestParams = messagesCreateMock.mock.calls[0][0];
    expect(requestParams.messages[0].content).toContain("私は毎朝コーヒーを飲みます。");
  });

  it("throws a clear error when Anthropic replies without a usable payload", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    messagesCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "pas de JSON ici" }],
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(translateText("私", "ja", "fr")).rejects.toThrow(TranslationServiceError);
  });
});

describe("getDistractorTranslations", () => {
  it("returns an empty array without querying findMany when the cache is empty", async () => {
    vi.mocked(prisma.translationCache.count).mockResolvedValue(0);

    const result = await getDistractorTranslations(["manger"], 3, "ja", "fr");

    expect(result).toEqual([]);
    expect(prisma.translationCache.findMany).not.toHaveBeenCalled();
  });

  it("returns an empty array without touching the database when count is 0", async () => {
    const result = await getDistractorTranslations(["manger"], 0, "ja", "fr");

    expect(result).toEqual([]);
    expect(prisma.translationCache.count).not.toHaveBeenCalled();
  });

  it("deduplicates and caps the result at the requested count", async () => {
    vi.mocked(prisma.translationCache.count).mockResolvedValue(10);
    vi.mocked(prisma.translationCache.findMany).mockResolvedValue([
      { translation: "boire" },
      { translation: "boire" },
      { translation: "dormir" },
      { translation: "courir" },
      { translation: "lire" },
    ] as never);

    const result = await getDistractorTranslations(["manger"], 3, "ja", "fr");

    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
    for (const meaning of result) {
      expect(["boire", "dormir", "courir", "lire"]).toContain(meaning);
    }
  });

  it("excludes the given meanings via the where clause", async () => {
    vi.mocked(prisma.translationCache.count).mockResolvedValue(5);
    vi.mocked(prisma.translationCache.findMany).mockResolvedValue([{ translation: "boire" }] as never);

    await getDistractorTranslations(["manger", "cuisiner"], 2, "ja", "fr");

    expect(prisma.translationCache.count).toHaveBeenCalledWith({
      where: {
        sourceLanguage: "ja",
        targetLanguage: "fr",
        translation: { notIn: ["manger", "cuisiner"] },
      },
    });
  });
});
