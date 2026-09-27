import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: { enabled: true },
      registerType: "autoUpdate",
      manifest: {
        name: "週報退勤時間",
        short_name: "週報",
        description: "退勤時間を記録して週報を作成するアプリ",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/weekly-report/",
        scope: '/weekly-report/',
        icons: [
          {
            src: "/weekly-report/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/weekly-report/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  base: '/weekly-report/',
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 1000,
      binaryInterval: 1500,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
