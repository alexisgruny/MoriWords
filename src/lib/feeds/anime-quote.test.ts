import { afterEach, describe, expect, it, vi } from "vitest";

import { QuoteServiceError, generateAnimeQuote } from "./anime-quote";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
});

describe("generateAnimeQuote", () => {
  it("throws a clear error when no Anthropic API key is configured", async () => {
    await expect(generateAnimeQuote()).rejects.toThrow(QuoteServiceError);
  });

  it("parses a valid quote payload from Anthropic", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                quote: "生きろ。",
                source: "もののけ姫 (1997)",
                character: "サン",
              }),
            },
          ],
        }),
      }),
    );

    const result = await generateAnimeQuote();

    expect(result).toEqual({
      content: "生きろ。",
      source: "もののけ姫 (1997)",
      character: "サン",
    });
  });

  it("parses a markdown-wrapped JSON response", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: "```json\n{\"quote\":\"生きろ。\",\"source\":\"もののけ姫 (1997)\",\"character\":null}\n```",
            },
          ],
        }),
      }),
    );

    const result = await generateAnimeQuote();

    expect(result).toEqual({
      content: "生きろ。",
      source: "もののけ姫 (1997)",
      character: null,
    });
  });

  it("includes previously used quotes as an exclusion list in the prompt", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify({ quote: "q", source: "s", character: null }) }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generateAnimeQuote(["前のセリフ"]);

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const promptText = requestBody.messages[0].content as string;
    expect(promptText).toContain("前のセリフ");
  });

  it("throws a clear timeout error without leaking upstream details", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(generateAnimeQuote()).rejects.toThrow(
      "La génération de citation met trop de temps à répondre.",
    );
  });

  it("throws a generic error without leaking the raw Anthropic error body", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
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

    await expect(generateAnimeQuote()).rejects.toThrow(QuoteServiceError);
    await expect(generateAnimeQuote()).rejects.toThrow(
      "Le service de citation est momentanément indisponible.",
    );
  });

  it("throws a clear error when the response has no exploitable JSON", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: "text", text: "pas de JSON ici" }] }),
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generateAnimeQuote()).rejects.toThrow(QuoteServiceError);
  });
});
