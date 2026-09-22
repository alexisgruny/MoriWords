import { prisma } from "@/lib/db/prisma";

const UNSPLASH_TIMEOUT_MS = 15_000;

export type ImageResult = {
  imageUrl: string;
  attribution: string | null;
};

export class ImageServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageServiceError";
  }
}

export async function searchCardImage(query: string): Promise<ImageResult | null> {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    return null;
  }

  const cached = await prisma.imageCache.findUnique({
    where: { query: cleanedQuery },
  });

  if (cached) {
    return { imageUrl: cached.imageUrl, attribution: cached.attribution };
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey || accessKey.trim().length === 0) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UNSPLASH_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanedQuery)}&per_page=1`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        signal: controller.signal,
      },
    );
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new ImageServiceError("La recherche d'image met trop de temps à répondre.");
    }

    console.error("Unsplash request failed:", fetchError);
    throw new ImageServiceError("Le service d'images est injoignable pour le moment.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error(`Unsplash API error (${response.status}):`, errorPayload || response.statusText);
    throw new ImageServiceError("Le service d'images est momentanément indisponible.");
  }

  const payload = (await response.json()) as {
    results?: Array<{
      urls?: { small?: string };
      user?: { name?: string; links?: { html?: string } };
      links?: { download_location?: string };
    }>;
  };

  const firstResult = payload.results?.[0];
  const imageUrl = firstResult?.urls?.small;

  if (!imageUrl) {
    return null;
  }

  const photographerName = firstResult?.user?.name;
  const photographerLink = firstResult?.user?.links?.html;
  const attribution = photographerName
    ? `Photo par ${photographerName} sur Unsplash${photographerLink ? ` (${photographerLink})` : ""}`
    : null;

  // Unsplash API guidelines require pinging the download endpoint when a photo is put into use.
  const downloadLocation = firstResult?.links?.download_location;
  if (downloadLocation) {
    fetch(downloadLocation, { headers: { Authorization: `Client-ID ${accessKey}` } }).catch(() => {
      // Best-effort tracking ping; a failure here must not block image selection.
    });
  }

  await prisma.imageCache.upsert({
    where: { query: cleanedQuery },
    update: { imageUrl, attribution },
    create: { query: cleanedQuery, imageUrl, attribution },
  });

  return { imageUrl, attribution };
}
