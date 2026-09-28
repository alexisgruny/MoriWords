import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Pages accessibles sans compte : référentiels (sans données personnelles
// ni appel à Claude), pages de connexion et pages légales.
const PUBLIC_PATHS = [
  "/connexion",
  "/inscription",
  "/kana",
  "/kanji",
  "/grammaire",
  "/conjugaison",
  "/exercices/kana",
  "/confidentialite",
  "/mentions-legales",
];
const AUTH_PATHS = ["/connexion", "/inscription"];

function matches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Redirection optimiste : ne vérifie que la présence du cookie de session.
// La vraie vérification se fait dans chaque route API (requireUser).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = getSessionCookie(request) !== null;

  if (hasSession && matches(pathname, AUTH_PATHS)) {
    return NextResponse.redirect(new URL("/", request.url));
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
