import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "crisis-lines.json"],
      manifest: {
        name: "ShadowFile",
        short_name: "ShadowFile",
        description: "A companion for the people who carry what they see.",
        theme_color: "#0b0d10",
        background_color: "#0b0d10",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,ico,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === "/crisis-lines.json",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "crisis-lines" }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  },
  server: { port: 5173, host: true }
});
