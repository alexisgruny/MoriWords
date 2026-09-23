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
import { TranslationServiceError, translateText } from "./translate";

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

  it("throws a clear timeout error when Anthropic does not respond in time", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(translateText("私", "ja", "fr")).rejects.toThrow(TranslationServiceError);
    await expect(translateText("私", "ja", "fr")).rejects.toThrow(
      "Le service de traduction met trop de temps à répondre. Réessaie dans un instant.",
    );
  });

  it("throws a generic error without leaking the raw Anthropic error body", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "sensitive upstream detail",
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(translateText("私", "ja", "fr")).rejects.toThrow(TranslationServiceError);
    await expect(translateText("私", "ja", "fr")).rejects.toThrow(
      "Le service de traduction est momentanément indisponible. Réessaie plus tard.",
    );
  });

  it("skips the cache and sends the surrounding sentence when a context is given", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              translation: "je",
              explanation: "Dans cette phrase, 私 est utilisé comme sujet et signifie ‘je’.",
            }),
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await translateText("私", "ja", "fr", "私は毎朝コーヒーを飲みます。");

    expect(result).toEqual({
      translation: "je",
      explanation: "Dans cette phrase, 私 est utilisé comme sujet et signifie ‘je’.",
      difficulty: "N5",
    });
    expect(prisma.translationCache.findUnique).not.toHaveBeenCalled();
    expect(prisma.translationCache.upsert).not.toHaveBeenCalled();

    const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(requestBody.messages[0].content).toContain("私は毎朝コーヒーを飲みます。");
  });

  it("throws a clear error when Anthropic replies without a usable payload", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(prisma.translationCache.findUnique).mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: "text", text: "pas de JSON ici" }] }),
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(translateText("私", "ja", "fr")).rejects.toThrow(TranslationServiceError);
  });
});
