/* global importScripts, firebase */
/**
 * RESQORA background push handler.
 *
 * This file is NOT registered on its own. It is imported by the generated
 * Workbox worker at /sw.js (see `workbox.importScripts` in vite.config.ts), so a
 * single root-scoped service worker owns both offline caching and Firebase
 * background notifications — no two workers fighting over "/".
 *
 * The Firebase web config is fetched from the app's public config endpoint, so
 * no keys are hardcoded here and a missing config simply disables push.
 */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const resqoraMessaging = fetch("/api/public/push-config")
  .then((response) => (response.ok ? response.json() : null))
  .then((payload) => {
    if (!payload || !payload.configured) return null;
    if (!firebase.apps.length) firebase.initializeApp(payload.config);
    return firebase.messaging();
  })
  .catch(() => null);

resqoraMessaging.then((messaging) => {
  if (!messaging) return;
  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const title = data.title || "RESQORA Emergency";
    self.registration.showNotification(title, {
      body: data.body || "Open RESQORA for the latest emergency status.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      // A stable tag collapses retries of the same event into one notification.
      tag: data.tag || "resqora-emergency",
      renotify: true,
      requireInteraction: data.kind === "sos" || data.kind === "guardian",
      data: { url: data.url || "/dashboard" },
    });
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    (async () => {
      const url = new URL(target, self.location.origin).href;
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if (client.url === url) return client.focus();
      }
      const existing = clients[0];
      if (existing && "navigate" in existing) {
        await existing.focus();
        return existing.navigate(url);
      }
      return self.clients.openWindow(url);
    })(),
  );
});
