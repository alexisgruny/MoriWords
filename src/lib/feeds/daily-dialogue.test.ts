import { afterEach, describe, expect, it, vi } from "vitest";

import { DialogueServiceError, generateDailyDialogue } from "./daily-dialogue";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
});

describe("generateDailyDialogue", () => {
  it("throws a clear error when no Anthropic API key is configured", async () => {
    await expect(generateDailyDialogue()).rejects.toThrow(DialogueServiceError);
  });

  it("parses a valid dialogue payload from Anthropic", async () => {
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
                dialogue: "店員：いらっしゃいませ。\n客：これをください。",
                scene: "買い物",
              }),
            },
          ],
        }),
      }),
    );

    const result = await generateDailyDialogue();

    expect(result).toEqual({
      content: "店員：いらっしゃいませ。\n客：これをください。",
      scene: "買い物",
    });
  });

  it("includes previously used scenes as an exclusion list in the prompt", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify({ dialogue: "d", scene: "s" }) }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generateDailyDialogue(["前のシーン"]);

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const promptText = requestBody.messages[0].content as string;
    expect(promptText).toContain("前のシーン");
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

    await expect(generateDailyDialogue()).rejects.toThrow(
      "Le service de dialogue est momentanément indisponible.",
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

    await expect(generateDailyDialogue()).rejects.toThrow(DialogueServiceError);
  });
});
