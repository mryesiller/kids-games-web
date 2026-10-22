import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

// MPA: ana sayfa + mevcut oyun sayfaları (F0'da yalnız memory; oyunlar eklenince otomatik büyür).
// base './' zorunlu: alt klasöre deploy edilebilirlik (PRD §3.2).
const gameIds = [
  "memory",
  "odd-one-out",
  "puzzle",
  "number-hunter",
  "pattern",
  "letter-fish",
  "maze",
  "sorter",
  "hanoi",
  "simon",
];

export default defineConfig({
  base: "./",
  test: {
    environment: "jsdom",
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      // ikonlar globPatterns (**/*.png) ile zaten precache'leniyor — includeAssets gereksiz
      manifest: {
        name: "Zeka Oyunları",
        short_name: "ZekaOyunları",
        description: "5-10 yaş çocuklar için reklamsız, girişsiz 10 mini zeka oyunu",
        lang: "tr",
        start_url: "./",
        display: "standalone",
        background_color: "#fdf6ec",
        theme_color: "#1d6fae",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // MPA: tek navigateFallback YOK — her HTML kendi precache girdisiyle karşılanır.
        globPatterns: ["**/*.{html,js,css,webp,png,svg,json}"],
        navigateFallback: undefined,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        ...Object.fromEntries(
          gameIds
            .filter((id) => existsSync(resolve(__dirname, `games/${id}/index.html`)))
            .map((id) => [id, resolve(__dirname, `games/${id}/index.html`)]),
        ),
      },
    },
  },
});
