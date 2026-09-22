import { prisma } from "@/lib/db/prisma";

// Délai maximum d'attente de la réponse d'Unsplash avant d'abandonner.
const UNSPLASH_TIMEOUT_MS = 15_000;

// Une image trouvée : son URL et le texte d'attribution du photographe.
export type ImageResult = {
  imageUrl: string;
  attribution: string | null;
};

// Erreur levée quand la recherche d'image échoue, avec un message
// compréhensible pour l'utilisateur (jamais le détail technique brut).
export class ImageServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageServiceError";
  }
}

// Cherche une image sur Unsplash pour illustrer un mot. Vérifie d'abord le
// cache pour ne pas rechercher deux fois la même chose ; renvoie null si
// aucune clé API n'est configurée ou si rien n'est trouvé, sans jamais
// bloquer la création de la carte.
export async function searchCardImage(query: string): Promise<ImageResult | null> {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    return null;
  }

  // Réutilise un résultat déjà trouvé pour cette même recherche.
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

  // Prépare l'annulation automatique si la requête prend trop de temps.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UNSPLASH_TIMEOUT_MS);

  let response: Response;

  try {
    // Interroge l'API de recherche de photos d'Unsplash.
    response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanedQuery)}&per_page=1`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        signal: controller.signal,
      },
    );
  } catch (fetchError) {
    // Distingue un simple délai dépassé d'une vraie panne réseau.
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new ImageServiceError("La recherche d'image met trop de temps à répondre.");
    }

    console.error("Unsplash request failed:", fetchError);
    throw new ImageServiceError("Le service d'images est injoignable pour le moment.");
  } finally {
    clearTimeout(timeoutId);
  }

  // Si Unsplash répond avec une erreur, on logue le détail côté serveur et
  // on renvoie un message générique côté client (jamais le détail brut).
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

  // Prend le premier résultat de recherche, s'il y en a un.
  const firstResult = payload.results?.[0];
  const imageUrl = firstResult?.urls?.small;

  if (!imageUrl) {
    return null;
  }

  // Construit le texte d'attribution du photographe, requis par Unsplash.
  const photographerName = firstResult?.user?.name;
  const photographerLink = firstResult?.user?.links?.html;
  const attribution = photographerName
    ? `Photo par ${photographerName} sur Unsplash${photographerLink ? ` (${photographerLink})` : ""}`
    : null;

  // Les conditions d'utilisation d'Unsplash demandent de signaler chaque
  // usage réel d'une photo via cet appel, sans bloquer si ça échoue.
  const downloadLocation = firstResult?.links?.download_location;
  if (downloadLocation) {
    fetch(downloadLocation, { headers: { Authorization: `Client-ID ${accessKey}` } }).catch(() => {
      // Ping de suivi en best-effort ; un échec ici ne doit pas bloquer le choix de l'image.
    });
  }

  // Mémorise le résultat pour ne pas refaire la même recherche plus tard.
  await prisma.imageCache.upsert({
    where: { query: cleanedQuery },
    update: { imageUrl, attribution },
    create: { query: cleanedQuery, imageUrl, attribution },
  });

  return { imageUrl, attribution };
}
