import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Vite konfiguracija za Territory PWA.
 * --host omogućuje pristup s telefona na istoj mreži (dev).
 */
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Territory",
        short_name: "Territory",
        description: "Osvajaj teritorij GPS tragom na mapi",
        theme_color: "#0b1f17",
        background_color: "#0b1f17",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
