import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
// @ts-expect-error type error without @types/node package
import process from "node:process";

// Backend the dev server proxies /api and /hubs to — same-origin calls from the app (see
// src/api/client.ts), so the phone can reach everything through this one host.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5080";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Custom service worker (src/sw.ts) instead of a generated one: it also handles
      // notificationclick, so tapping a reminder opens the right module.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon.svg", "favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Moneta",
        short_name: "Moneta",
        description: "Rotinas, lembretes e controle de despesas pessoais e de trabalho.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#22242b",
        theme_color: "#22242b",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      // No service worker under `pnpm dev`: the injectManifest SW needs the build's precache
      // manifest, and a dev SW only gets in the way with stale caches. Test the PWA via the build.
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 1420,
    strictPort: true,
    // Exposes the dev server on the LAN so the phone can open it.
    host: true,
    proxy: {
      "/api": BACKEND_URL,
      "/hubs": { target: BACKEND_URL, ws: true },
    },
  },
});
