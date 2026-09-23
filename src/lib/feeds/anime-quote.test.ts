import { afterEach, describe, expect, it, vi } from "vitest";

const { messagesCreateMock } = vi.hoisted(() => ({ messagesCreateMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();

  class MockAnthropic {
    messages = { create: messagesCreateMock };
  }

  // Les classes d'erreur (APIError, APIConnectionTimeoutError, ...) sont des statiques
  // héritées de BaseAnthropic : on relie la chaîne de prototype statique pour les garder
  // accessibles sur le client mocké (claude-json-generator.ts fait `instanceof Anthropic.XError`).
  Object.setPrototypeOf(MockAnthropic, actual.default);

  return { ...actual, default: MockAnthropic };
});

import Anthropic from "@anthropic-ai/sdk";

import { QuoteServiceError, generateAnimeQuote } from "./anime-quote";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
  messagesCreateMock.mockReset();
});

describe("generateAnimeQuote", () => {
  it("throws a clear error when no Anthropic API key is configured", async () => {
    await expect(generateAnimeQuote()).rejects.toThrow(QuoteServiceError);
  });

  it("parses a valid quote payload from Anthropic", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({
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
    });

    const result = await generateAnimeQuote();

    expect(result).toEqual({
      content: "生きろ。",
      source: "もののけ姫 (1997)",
      character: "サン",
    });
  });

  it("parses a markdown-wrapped JSON response", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "```json\n{\"quote\":\"生きろ。\",\"source\":\"もののけ姫 (1997)\",\"character\":null}\n```",
        },
      ],
    });

    const result = await generateAnimeQuote();

    expect(result).toEqual({
      content: "生きろ。",
      source: "もののけ姫 (1997)",
      character: null,
    });
  });

  it("includes previously used quotes as an exclusion list in the prompt", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ quote: "q", source: "s", character: null }) }],
    });

    await generateAnimeQuote(["前のセリフ"]);

    const requestParams = messagesCreateMock.mock.calls[0][0];
    expect(requestParams.messages[0].content).toContain("前のセリフ");
  });

  it("throws a clear timeout error without leaking upstream details", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockRejectedValue(new Anthropic.APIConnectionTimeoutError({}));

    await expect(generateAnimeQuote()).rejects.toThrow(
      "La génération de citation met trop de temps à répondre.",
    );
  });

  it("throws a generic error without leaking the raw Anthropic error body", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockRejectedValue(
      new Anthropic.APIError(500, undefined, "sensitive upstream detail", undefined),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generateAnimeQuote()).rejects.toThrow(QuoteServiceError);
    await expect(generateAnimeQuote()).rejects.toThrow(
      "Le service de citation est momentanément indisponible.",
    );
  });

  it("throws a clear error when the response has no exploitable JSON", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "pas de JSON ici" }],
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generateAnimeQuote()).rejects.toThrow(QuoteServiceError);
  });
});
