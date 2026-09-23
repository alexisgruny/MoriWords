import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    sourceText: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { NewsRssServiceError, fetchNewsRssItems, ingestNextNewsArticle } from "./news-rss";

// Flux RSS minimal au format nippon.com : deux articles exploitables et un
// article dont le résumé est trop court pour être utile (juste l'agence de
// presse), qui doit être filtré.
const SAMPLE_FEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>nippon.com / ja</title>
<item>
<title>区名に「ミャクミャク」案が浮上</title>
<link>https://www.nippon.com/ja/news/article-1/</link>
<pubDate>Wed, 23 Sep 2026 12:06:02 +0900</pubDate>
<description><![CDATA[政令市の大阪市を特別区に再編する「大阪都構想」で、区の名称案が急浮上した。　共同通信]]></description>
</item>
<item>
<title>サッカーJ1川崎FW小林、現役引退表明</title>
<link>https://www.nippon.com/ja/news/article-2/</link>
<pubDate>Wed, 23 Sep 2026 11:58:32 +0900</pubDate>
<description><![CDATA[  共同通信]]></description>
</item>
<item>
<title>NY原油、一時90ドル割れ</title>
<link>https://www.nippon.com/ja/news/article-3/</link>
<pubDate>Wed, 23 Sep 2026 11:07:33 +0900</pubDate>
<description><![CDATA[ニューヨーク原油市場は22日、需要減退への懸念から一時1バレル=90ドルを割り込んだ。　共同通信]]></description>
</item>
</channel>
</rss>`;

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.mocked(prisma.sourceText.findMany).mockReset();
  vi.mocked(prisma.sourceText.create).mockReset();
});

describe("fetchNewsRssItems", () => {
  it("parses the feed and filters out items with an essentially empty summary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_FEED_XML,
      }),
    );

    const items = await fetchNewsRssItems();

    expect(items).toEqual([
      {
        title: "区名に「ミャクミャク」案が浮上",
        sourceUrl: "https://www.nippon.com/ja/news/article-1/",
        publishedAt: new Date("Wed, 23 Sep 2026 12:06:02 +0900"),
        content: "政令市の大阪市を特別区に再編する「大阪都構想」で、区の名称案が急浮上した。　共同通信",
      },
      {
        title: "NY原油、一時90ドル割れ",
        sourceUrl: "https://www.nippon.com/ja/news/article-3/",
        publishedAt: new Date("Wed, 23 Sep 2026 11:07:33 +0900"),
        content: "ニューヨーク原油市場は22日、需要減退への懸念から一時1バレル=90ドルを割り込んだ。　共同通信",
      },
    ]);
  });

  it("throws a clear timeout error without leaking upstream details", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(fetchNewsRssItems()).rejects.toThrow(NewsRssServiceError);
    await expect(fetchNewsRssItems()).rejects.toThrow(
      "Le flux RSS d'actualités met trop de temps à répondre.",
    );
  });

  it("throws a generic error without leaking the raw HTTP error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Internal Server Error" }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(fetchNewsRssItems()).rejects.toThrow(NewsRssServiceError);
    await expect(fetchNewsRssItems()).rejects.toThrow(
      "Le flux RSS d'actualités est momentanément indisponible.",
    );
  });
});

describe("ingestNextNewsArticle", () => {
  it("creates a SourceText for the first article not already imported", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => SAMPLE_FEED_XML }),
    );
    vi.mocked(prisma.sourceText.findMany).mockResolvedValue([
      { sourceUrl: "https://www.nippon.com/ja/news/article-1/" },
    ] as never);
    vi.mocked(prisma.sourceText.create).mockResolvedValue({ id: "created-1" } as never);

    const result = await ingestNextNewsArticle();

    expect(result).toEqual({ id: "created-1" });
    expect(prisma.sourceText.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        // content ne doit pas répéter le titre (déjà affiché séparément
        // dans l'historique ; un doublon serait redondant pour un lecteur
        // d'écran, voir le commentaire dans news-rss.ts).
        content: "ニューヨーク原油市場は22日、需要減退への懸念から一時1バレル=90ドルを割り込んだ。　共同通信",
        title: "NY原油、一時90ドル割れ",
        sourceUrl: "https://www.nippon.com/ja/news/article-3/",
        origin: "nippon-news-rss",
        category: "news",
      }),
    });
  });

  it("returns null when every article currently in the feed has already been imported", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => SAMPLE_FEED_XML }),
    );
    vi.mocked(prisma.sourceText.findMany).mockResolvedValue([
      { sourceUrl: "https://www.nippon.com/ja/news/article-1/" },
      { sourceUrl: "https://www.nippon.com/ja/news/article-3/" },
    ] as never);

    const result = await ingestNextNewsArticle();

    expect(result).toBeNull();
    expect(prisma.sourceText.create).not.toHaveBeenCalled();
  });
});
