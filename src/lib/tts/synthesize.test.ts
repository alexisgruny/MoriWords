import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    audioCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { TtsServiceError, synthesizeSpeech } from "./synthesize";

afterEach(() => {
  delete process.env.ELEVENLABS_API_KEY;
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.mocked(prisma.audioCache.findUnique).mockReset();
  vi.mocked(prisma.audioCache.upsert).mockReset();
});

describe("synthesizeSpeech", () => {
  it("returns null when no ElevenLabs API key is configured and nothing is cached", async () => {
    vi.mocked(prisma.audioCache.findUnique).mockResolvedValue(null);

    const result = await synthesizeSpeech("こんにちは", "ja");

    expect(result).toBeNull();
  });

  it("returns the cached audio without calling ElevenLabs", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    vi.mocked(prisma.audioCache.findUnique).mockResolvedValue({ id: "cache-1" } as never);

    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await synthesizeSpeech("こんにちは", "ja");

    expect(result).toEqual({ audioCacheId: "cache-1" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls ElevenLabs and stores the audio when nothing is cached", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    vi.mocked(prisma.audioCache.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.audioCache.upsert).mockResolvedValue({ id: "cache-2" } as never);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      }),
    );

    const result = await synthesizeSpeech("こんにちは", "ja");

    expect(result).toEqual({ audioCacheId: "cache-2" });
    expect(prisma.audioCache.upsert).toHaveBeenCalled();
  });

  it("throws a clear timeout error when ElevenLabs does not respond in time", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    vi.mocked(prisma.audioCache.findUnique).mockResolvedValue(null);

    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(synthesizeSpeech("こんにちは", "ja")).rejects.toThrow(TtsServiceError);
  });

  it("throws a generic error without leaking the raw ElevenLabs error body", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    vi.mocked(prisma.audioCache.findUnique).mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "sensitive upstream detail",
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(synthesizeSpeech("こんにちは", "ja")).rejects.toThrow(TtsServiceError);
    await expect(synthesizeSpeech("こんにちは", "ja")).rejects.toThrow(
      "Le service audio est momentanément indisponible.",
    );
  });

  it("returns null for empty text without touching the cache or the API", async () => {
    const result = await synthesizeSpeech("   ", "ja");

    expect(result).toBeNull();
    expect(prisma.audioCache.findUnique).not.toHaveBeenCalled();
  });
});
