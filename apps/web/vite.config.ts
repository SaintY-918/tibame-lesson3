import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: Number(process.env.WEB_PORT ?? 5174),
    proxy: {
      "/api": {
        target: process.env.API_TARGET ?? "http://localhost:3010",
        changeOrigin: true,
      },
    },
  },
});
