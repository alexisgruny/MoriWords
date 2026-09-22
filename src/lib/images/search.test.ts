import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    imageCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { ImageServiceError, searchCardImage } from "./search";

afterEach(() => {
  delete process.env.UNSPLASH_ACCESS_KEY;
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.mocked(prisma.imageCache.findUnique).mockReset();
  vi.mocked(prisma.imageCache.upsert).mockReset();
});

describe("searchCardImage", () => {
  it("returns null when no Unsplash access key is configured and nothing is cached", async () => {
    vi.mocked(prisma.imageCache.findUnique).mockResolvedValue(null);

    const result = await searchCardImage("délicieux");

    expect(result).toBeNull();
  });

  it("returns the cached image without calling Unsplash", async () => {
    vi.mocked(prisma.imageCache.findUnique).mockResolvedValue({
      query: "délicieux",
      imageUrl: "https://images.unsplash.com/cached.jpg",
      attribution: "Photo par Quelqu'un sur Unsplash",
    } as never);

    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await searchCardImage("délicieux");

    expect(result).toEqual({
      imageUrl: "https://images.unsplash.com/cached.jpg",
      attribution: "Photo par Quelqu'un sur Unsplash",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls Unsplash, stores the result and pings the download endpoint when nothing is cached", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    vi.mocked(prisma.imageCache.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.imageCache.upsert).mockResolvedValue({} as never);

    const downloadPing = vi.fn().mockResolvedValue({ ok: true });
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "https://example.com/download") {
        return downloadPing();
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          results: [
            {
              urls: { small: "https://images.unsplash.com/photo.jpg" },
              user: { name: "Jane Doe", links: { html: "https://unsplash.com/@jane" } },
              links: { download_location: "https://example.com/download" },
            },
          ],
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchCardImage("délicieux");

    expect(result).toEqual({
      imageUrl: "https://images.unsplash.com/photo.jpg",
      attribution: "Photo par Jane Doe sur Unsplash (https://unsplash.com/@jane)",
    });
    expect(prisma.imageCache.upsert).toHaveBeenCalled();
  });

  it("throws a generic error without leaking the raw Unsplash error body", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    vi.mocked(prisma.imageCache.findUnique).mockResolvedValue(null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "sensitive upstream detail",
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(searchCardImage("délicieux")).rejects.toThrow(ImageServiceError);
  });

  it("returns null for an empty query without touching the cache or the API", async () => {
    const result = await searchCardImage("   ");

    expect(result).toBeNull();
    expect(prisma.imageCache.findUnique).not.toHaveBeenCalled();
  });
});
