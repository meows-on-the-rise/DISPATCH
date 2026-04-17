import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
  server: {
    port: 5173,
    // Proxy API calls to backend during development so you don't
    // need to touch CORS or set VITE_API_URL locally
    proxy: {
      "/auth": "http://localhost:3000",
      "/users": "http://localhost:3000",
      "/wallet": "http://localhost:3000",
      "/trips": "http://localhost:3000",
      "/drivers": "http://localhost:3000",
      "/admin": "http://localhost:3000",
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split large dependencies into separate chunks
        manualChunks: {
          leaflet: ["leaflet", "react-leaflet"],
          socketio: ["socket.io-client"],
          vendor: ["react", "react-dom", "react-router", "zustand", "axios"],
        },
      },
    },
  },
});
