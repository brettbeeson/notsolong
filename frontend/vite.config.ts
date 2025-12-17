import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/static/",
  plugins: [react()],
  build: {
    // When the frontend is served as static files (e.g. by Django/WhiteNoise),
    // sourcemaps are required for TS/TSX breakpoints to bind in DevTools/VS Code.
    // Keep this opt-in to avoid shipping source in production unintentionally.
    sourcemap: process.env.VITE_SOURCEMAP === "true",
    
  },
  server: {
    host: true,
    allowedHosts: ["silverlinux.local"],
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
}));
