// Minimal service worker: enough for browsers to offer "Install app".
// It deliberately caches nothing, so signed-in pages and audio are always fresh from the network.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
