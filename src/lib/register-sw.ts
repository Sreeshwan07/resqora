/**
 * Guarded registration of the single authoritative root service worker.
 *
 * /sw.js is the ONLY worker RESQORA registers: Workbox owns offline caching and
 * it imports /fcm-sw-handler.js for Firebase background push, so nothing else
 * competes for the "/" scope. Offline caching must never run inside the Lovable
 * editor preview, an iframe, or dev — stale HTML there would serve deleted
 * chunks. `?sw=off` acts as a kill switch.
 */
const SW_URL = "/sw.js";
const LEGACY_SW_PATHS = ["/firebase-messaging-sw.js", "/service-worker.js"];

let registration: Promise<ServiceWorkerRegistration | null> | null = null;

function supported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

function shouldRegister() {
  if (!supported()) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return false;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return false;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return false;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has("sw")) return params.get("sw") !== "off";
  return true;
}

function scriptUrl(reg: ServiceWorkerRegistration) {
  return reg.active?.scriptURL ?? reg.waiting?.scriptURL ?? reg.installing?.scriptURL ?? "";
}

/** Evicts workers from earlier releases so only /sw.js controls the root scope. */
async function unregisterLegacyWorkers() {
  if (!supported()) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((reg) => LEGACY_SW_PATHS.some((path) => scriptUrl(reg).endsWith(path)))
      .map((reg) => reg.unregister()),
  );
}

async function unregisterAppWorker() {
  if (!supported()) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations.filter((reg) => scriptUrl(reg).endsWith(SW_URL)).map((reg) => reg.unregister()),
  );
}

/**
 * Registers (or reuses) the root worker. Calling this repeatedly — remounts,
 * repeated refreshes, the push client asking for a worker — resolves to the same
 * registration instead of creating competing ones.
 */
export function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!shouldRegister()) {
    void unregisterAppWorker();
    void unregisterLegacyWorkers();
    return Promise.resolve(null);
  }
  registration ??= (async () => {
    await unregisterLegacyWorkers();
    const existing = await navigator.serviceWorker.getRegistration(SW_URL);
    // registerType: "autoUpdate" ships skipWaiting/clientsClaim, so re-registering
    // the same URL only triggers an update check — never a second worker.
    const reg = existing ?? (await navigator.serviceWorker.register(SW_URL, { scope: "/" }));
    void reg.update().catch(() => undefined);
    return reg;
  })().catch(() => null);
  return registration;
}

export function registerServiceWorker() {
  void ensureServiceWorker();
}
