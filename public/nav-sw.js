/**
 * RESQORA navigation handler.
 *
 * Imported first by the generated Workbox worker at /sw.js, so this fetch
 * listener answers page navigations before any Workbox route does (the first
 * listener to call respondWith wins). That keeps one authoritative behaviour for
 * HTML:
 *
 *   network first  → always the freshest server-rendered page while online
 *   cached page    → the last page of the same URL when the network fails
 *   /offline.html  → an honest OFFLINE shell when nothing is cached
 *
 * Only HTML documents are handled here; assets and background push stay with
 * Workbox and /fcm-sw-handler.js. API and OAuth traffic is never served from a
 * cache, so emergency data can never be answered with stale content.
 */
const RESQORA_PAGE_CACHE = "resqora-pages-v1";
const RESQORA_OFFLINE_URL = "/offline.html";
const RESQORA_NETWORK_TIMEOUT = 5000;

function resqoraBypass(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/~oauth");
}

async function resqoraNavigate(request) {
  const cache = await caches.open(RESQORA_PAGE_CACHE);
  try {
    const response = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("network timeout")), RESQORA_NETWORK_TIMEOUT);
      fetch(request).then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const offline = await caches.match(RESQORA_OFFLINE_URL, { ignoreSearch: true });
    if (offline) return offline;
    return new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || resqoraBypass(url)) return;
  event.respondWith(resqoraNavigate(request));
});
