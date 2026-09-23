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

import { NewsSummaryServiceError, generateNewsSummary } from "./news-summary";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
  messagesCreateMock.mockReset();
});

describe("generateNewsSummary", () => {
  it("throws a clear error when no Anthropic API key is configured", async () => {
    await expect(generateNewsSummary()).rejects.toThrow(NewsSummaryServiceError);
  });

  it("parses a valid news payload from Anthropic", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({ text: "今日は天気がいいです。", topic: "天気" }),
        },
      ],
    });

    const result = await generateNewsSummary();

    expect(result).toEqual({ content: "今日は天気がいいです。", topic: "天気" });
  });

  it("includes previously used topics as an exclusion list in the prompt", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ text: "t", topic: "s" }) }],
    });

    await generateNewsSummary(["前の話題"]);

    const requestParams = messagesCreateMock.mock.calls[0][0];
    expect(requestParams.messages[0].content).toContain("前の話題");
  });

  it("throws a generic error without leaking the raw Anthropic error body", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockRejectedValue(
      new Anthropic.APIError(500, undefined, "sensitive upstream detail", undefined),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generateNewsSummary()).rejects.toThrow(
      "Le service d'actualité est momentanément indisponible.",
    );
  });

  it("throws a clear error when the response has no exploitable JSON", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "pas de JSON ici" }],
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generateNewsSummary()).rejects.toThrow(NewsSummaryServiceError);
  });
});
