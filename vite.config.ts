import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import type { IncomingHttpHeaders } from "node:http";
import chatHandler from "./api/chat";

function toRequestHeaders(headers: IncomingHttpHeaders): Headers {
  const requestHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      requestHeaders.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) requestHeaders.append(key, item);
    }
  }
  return requestHeaders;
}

async function readNodeBody(req: import("node:http").IncomingMessage): Promise<Uint8Array | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return undefined;
  return Buffer.concat(chunks);
}

function devApiPlugin() {
  return {
    name: "shadowfile-dev-api",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/chat")) return next();

        try {
          const body = await readNodeBody(req);
          const url = new URL(req.url, `http://${req.headers.host ?? "127.0.0.1:5173"}`);
          const request = new Request(url, {
            method: req.method,
            headers: toRequestHeaders(req.headers),
            body
          });
          const response = await chatHandler(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));

          if (!response.body) {
            res.end();
            return;
          }

          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
          res.end();
        } catch (error) {
          res.statusCode = 500;
          res.end(error instanceof Error ? error.message : "Dev API failure");
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, __dirname, ""));

  return {
    plugins: [
      react(),
      devApiPlugin(),
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
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,json,ico,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === "/crisis-lines.json",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "crisis-lines" }
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "libsodium-wrappers-sumo": path.resolve(
          __dirname,
          "node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js"
        )
      }
    },
    server: { port: 5173, host: true }
  };
});
