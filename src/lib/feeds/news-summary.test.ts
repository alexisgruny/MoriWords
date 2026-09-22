import { afterEach, describe, expect, it, vi } from "vitest";

import { NewsSummaryServiceError, generateNewsSummary } from "./news-summary";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
});

describe("generateNewsSummary", () => {
  it("throws a clear error when no Anthropic API key is configured", async () => {
    await expect(generateNewsSummary()).rejects.toThrow(NewsSummaryServiceError);
  });

  it("parses a valid news payload from Anthropic", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify({ text: "今日は天気がいいです。", topic: "天気" }),
            },
          ],
        }),
      }),
    );

    const result = await generateNewsSummary();

    expect(result).toEqual({ content: "今日は天気がいいです。", topic: "天気" });
  });

  it("includes previously used topics as an exclusion list in the prompt", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify({ text: "t", topic: "s" }) }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generateNewsSummary(["前の話題"]);

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const promptText = requestBody.messages[0].content as string;
    expect(promptText).toContain("前の話題");
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

    await expect(generateNewsSummary()).rejects.toThrow(
      "Le service d'actualité est momentanément indisponible.",
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

    await expect(generateNewsSummary()).rejects.toThrow(NewsSummaryServiceError);
  });
});
