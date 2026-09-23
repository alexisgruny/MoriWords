import { afterEach, describe, expect, it, vi } from "vitest";

const { messagesCreateMock } = vi.hoisted(() => ({ messagesCreateMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();

  class MockAnthropic {
    messages = { create: messagesCreateMock };
  }

  Object.setPrototypeOf(MockAnthropic, actual.default);

  return { ...actual, default: MockAnthropic };
});

import { toEnglishImageQuery } from "./gloss";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.restoreAllMocks();
  messagesCreateMock.mockReset();
});

describe("toEnglishImageQuery", () => {
  it("returns the original term when no API key is configured", async () => {
    const result = await toEnglishImageQuery("délicieux", "fr");

    expect(result).toBe("délicieux");
  });

  it("returns the original term for empty input without calling the API", async () => {
    const result = await toEnglishImageQuery("   ", "fr");

    expect(result).toBe("");
    expect(messagesCreateMock).not.toHaveBeenCalled();
  });

  it("returns Claude's English gloss when the API call succeeds", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({ content: [{ type: "text", text: "delicious food" }] });

    const result = await toEnglishImageQuery("délicieux", "fr");

    expect(result).toBe("delicious food");
  });

  it("states the source language explicitly to avoid cross-lingual homograph mixups", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockResolvedValue({ content: [{ type: "text", text: "cat" }] });

    await toEnglishImageQuery("chat", "fr");

    const requestParams = messagesCreateMock.mock.calls[0][0];
    const promptText = requestParams.messages[0].content as string;
    expect(promptText).toContain("French");
    expect(promptText).toContain("chat");
  });

  it("falls back to the original term when the API call fails", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockRejectedValue(new Error("Error"));

    const result = await toEnglishImageQuery("délicieux", "fr");

    expect(result).toBe("délicieux");
  });

  it("falls back to the original term when the request throws", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    messagesCreateMock.mockRejectedValue(new Error("network down"));

    const result = await toEnglishImageQuery("délicieux", "fr");

    expect(result).toBe("délicieux");
  });
});
