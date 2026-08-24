const CACHE_NAME = "gopaq-shell-v2";
const PUBLIC_SHELL = new Set(["/", "/manifest.webmanifest", "/sw.js"]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([...PUBLIC_SHELL])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isApi = url.pathname.startsWith("/api/");
  const hasCredentials = event.request.credentials === "include" || event.request.headers.has("authorization") || event.request.headers.has("cookie");
  const isPublicShell = PUBLIC_SHELL.has(url.pathname);
  if (isApi || hasCredentials || !isPublicShell) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
