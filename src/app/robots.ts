import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Robots : pages publiques ouvertes, API et pages de compte fermées (elles
// répondent 401 ou redirigent vers la connexion).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/exercices/kana"],
      disallow: ["/api/", "/admin", "/compte", "/decks", "/vocabulaire", "/historique", "/paliers", "/exercices"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
