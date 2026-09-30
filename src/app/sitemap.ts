import type { MetadataRoute } from "next";

import { INDEXABLE_PATHS, SITE_URL } from "@/lib/site";

// Plan du site : seulement les pages publiques.
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/bienvenue" ? 1 : path.startsWith("/parcours") ? 0.8 : 0.6,
  }));
}
