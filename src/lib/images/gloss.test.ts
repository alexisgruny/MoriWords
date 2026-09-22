import { afterEach, describe, expect, it, vi } from "vitest";

import { toEnglishImageQuery } from "./gloss";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
});

describe("toEnglishImageQuery", () => {
  it("returns the original term when no API key is configured", async () => {
    const result = await toEnglishImageQuery("délicieux", "fr");

    expect(result).toBe("délicieux");
  });

  it("returns the original term for empty input without calling the API", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await toEnglishImageQuery("   ", "fr");

    expect(result).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns Claude's English gloss when the API call succeeds", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: "text", text: "delicious food" }] }),
      }),
    );

    const result = await toEnglishImageQuery("délicieux", "fr");

    expect(result).toBe("delicious food");
  });

  it("states the source language explicitly to avoid cross-lingual homograph mixups", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "cat" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await toEnglishImageQuery("chat", "fr");

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const promptText = requestBody.messages[0].content as string;
    expect(promptText).toContain("French");
    expect(promptText).toContain("chat");
  });

  it("falls back to the original term when the API call fails", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Error" }),
    );

    const result = await toEnglishImageQuery("délicieux", "fr");

    expect(result).toBe("délicieux");
  });

  it("falls back to the original term when the request throws", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await toEnglishImageQuery("délicieux", "fr");

    expect(result).toBe("délicieux");
  });
});
