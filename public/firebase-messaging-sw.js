/**
 * Retired worker — kept at this path only to evict itself from browsers that
 * registered it in an earlier release.
 *
 * Background push now lives inside the single root worker at /sw.js (which
 * imports /fcm-sw-handler.js), so this file must never handle notifications
 * again — two root-scoped workers would duplicate them.
 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(self.registration.unregister().catch(() => undefined)),
);
