import type { MetadataRoute } from "next";

// Manifeste de l'application : permet d'installer MoriWords sur l'écran
// d'accueil du téléphone (icône, ouverture en plein écran sans barre du
// navigateur). Pas de service worker : il n'est pas nécessaire pour
// l'installation, et un cache hors ligne mal réglé servirait des pages
// périmées de compte.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoriWords",
    short_name: "MoriWords",
    description: "Tes animes deviennent tes cours de japonais, expliqués en français.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f5f1",
    theme_color: "#f5f5f1",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Réviser", url: "/decks/reviser" },
      { name: "Analyser une réplique", url: "/" },
    ],
  };
}
