import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Pages accessibles sans compte : référentiels (sans données personnelles
// ni appel à Claude), accueil public, pages de connexion et pages légales.
const PUBLIC_PATHS = [
  "/bienvenue",
  "/parcours",
  "/connexion",
  "/inscription",
  "/kana",
  "/kanji",
  "/grammaire",
  "/conjugaison",
  "/exercices/kana",
  "/jeux",
  "/confidentialite",
  "/mentions-legales",
  // Image d'aperçu de partage (src/app/opengraph-image.tsx) : lue par les
  // robots des réseaux sociaux, sans session.
  "/opengraph-image",
];

function matches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Redirection optimiste : ne vérifie que la présence du cookie de session.
// La vraie vérification se fait dans chaque route API (requireUser).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = getSessionCookie(request) !== null;

  // Un visiteur sans compte découvre d'abord le site, pas un formulaire.
  if (!hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/bienvenue", request.url));
  }

  if (!hasSession && !matches(pathname, PUBLIC_PATHS)) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("suivant", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Ni les routes API (elles répondent 401 elles-mêmes), ni les fichiers statiques.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
