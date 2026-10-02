import { COURSES } from "@/lib/course/courses";
import { GAMES } from "@/lib/games/catalog";

// Adresse publique du site (liens absolus du sitemap et des aperçus de
// partage). Surchargeable pour un futur nom de domaine.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://moriwords.vercel.app";

// Pages lisibles sans compte, à faire connaître aux moteurs de recherche
// (les pages privées redirigent vers la connexion, voir src/proxy.ts).
export const INDEXABLE_PATHS: string[] = [
  "/bienvenue",
  "/lecons",
  ...COURSES.flatMap((course) => [course.basePath, ...course.lessons.map((lesson) => `${course.basePath}/${lesson.id}`)]),
  "/kana",
  "/exercices/kana",
  "/kanji",
  "/grammaire",
  "/conjugaison",
  "/jeux",
  ...GAMES.map((game) => `/jeux/${game.id}`),
  "/inscription",
  "/confidentialite",
  "/mentions-legales",
];
