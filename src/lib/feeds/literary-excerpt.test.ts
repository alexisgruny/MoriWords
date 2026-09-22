import { afterEach, describe, expect, it, vi } from "vitest";

import { LiteraryExcerptServiceError, generateLiteraryExcerpt } from "./literary-excerpt";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
});

describe("generateLiteraryExcerpt", () => {
  it("throws a clear error when no Anthropic API key is configured", async () => {
    await expect(generateLiteraryExcerpt()).rejects.toThrow(LiteraryExcerptServiceError);
  });

  it("parses a valid excerpt payload from Anthropic", async () => {
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
                text: "吾輩は猫である。名前はまだ無い。",
                styleReference: "Style de : 夏目漱石",
              }),
            },
          ],
        }),
      }),
    );

    const result = await generateLiteraryExcerpt();

    expect(result).toEqual({
      content: "吾輩は猫である。名前はまだ無い。",
      styleReference: "Style de : 夏目漱石",
    });
  });

  it("includes previously used styles as an exclusion list in the prompt", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify({ text: "t", styleReference: "s" }) }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generateLiteraryExcerpt(["前のスタイル"]);

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const promptText = requestBody.messages[0].content as string;
    expect(promptText).toContain("前のスタイル");
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

    await expect(generateLiteraryExcerpt()).rejects.toThrow(
      "Le service d'extrait est momentanément indisponible.",
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

    await expect(generateLiteraryExcerpt()).rejects.toThrow(LiteraryExcerptServiceError);
  });
});
