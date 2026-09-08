// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        // src/lib/register-sw.ts is the only registrar (guards out preview/dev).
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        manifest: false,
        workbox: {
          // The client build lands in dist/client while Vite's outDir is dist, so
          // without these the worker is written outside the served directory and
          // /sw.js 404s in production (with precache URLs prefixed "client/").
          globDirectory: "dist/client",
          swDest: "dist/client/sw.js",
          globPatterns: ["**/*.{js,css,html,png,jpg,webp,svg,ico,woff2,webmanifest}"],
          // Navigations and Firebase background push live INSIDE this worker, so
          // /sw.js stays the only root-scoped worker. The retired standalone
          // messaging worker and these imported scripts must not be precached; iOS
          // launch images are painted by Safari before the SW is involved, so
          // precaching ~800 KB of them would only slow the first install.
          importScripts: ["/nav-sw.js", "/fcm-sw-handler.js"],
          globIgnores: [
            "**/firebase-messaging-sw.js",
            "**/fcm-sw-handler.js",
            "**/nav-sw.js",
            "brand/splash-*.jpg",
          ],
          // Drop caches left by previous precache revisions on activation, while
          // leaving the caches the new worker still needs untouched.
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          // Never let the shell answer server routes: emergency, auth and API
          // traffic must always hit the network. Navigations are handled by
          // /nav-sw.js (network first, then last page, then /offline.html).
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ request, sameOrigin }) =>
                sameOrigin && ["script", "style", "font", "image"].includes(request.destination),
              handler: "CacheFirst",
              options: {
                cacheName: "resqora-assets-v1",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
  },
});
