/**
 * Overa service worker (PWA).
 *
 * Strategy (kept intentionally conservative so it can never break the app):
 *  - Navigations (page loads): network-first, fall back to the cached page
 *    (then to "/") only when the network is unavailable.
 *  - Static assets (_next/static, /assets/, /logo.svg): stale-while-revalidate.
 *  - API calls (/api/) and cross-origin requests are never intercepted.
 *  - Non-GET requests are never handled.
 */
const VERSION = "overa-pwa-v1";
const CORE_CACHE = `${VERSION}-core`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const CORE_ASSETS = [
  "/manifest.webmanifest",
  "/assets/img/pwa/icon-192.png",
  "/assets/img/pwa/icon-512.png",
  "/assets/img/pwa/icon-maskable-512.png",
  "/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: network first, cache as offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Immutable Next.js build output and static assets: SWR.
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname === "/logo.svg";

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
