// Service worker MoriWords : continuer à lire les kana et à jouer sans
// réseau (dans le métro…). Volontairement prudent :
// - pages : réseau d'abord, copie en cache seulement si le réseau échoue
//   (un utilisateur connecté a toujours la dernière version) ;
// - fichiers /_next/static : cache d'abord (noms uniques à chaque version) ;
// - API : jamais en cache (pas de données personnelles stockées, pas de
//   révision périmée).
const VERSION = "v1";
const STATIC_CACHE = `moriwords-static-${VERSION}`;
const PAGES_CACHE = `moriwords-pages-${VERSION}`;
const OFFLINE_URL = "/hors-ligne";
const MAX_PAGES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("moriwords-") && !key.endsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function trimPages(cache) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) {
    await cache.delete(key);
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    // Seulement les vraies pages (pas les redirections vers la connexion).
    if (response.ok && !response.redirected && response.type === "basic") {
      await cache.put(request, response.clone());
      await trimPages(cache);
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/strokes/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirstStatic(request));
  }
});
