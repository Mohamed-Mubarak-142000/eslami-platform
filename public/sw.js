// Minimal offline-fallback service worker for the Twister storefront (SCR-010).
// Intentionally conservative: caches only the offline fallback route, never intercepts API-like
// requests, and fails open (falls through to the network) rather than risking a stuck cache.
// Registration is opt-in via `src/lib/pwa.ts#registerServiceWorker` — nothing calls it yet.

const CACHE_NAME = "twister-shell-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error())),
  );
});
