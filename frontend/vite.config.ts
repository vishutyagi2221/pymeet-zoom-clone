import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const proxy = {
  "/api": {
    target: process.env.VITE_BACKEND_URL || "http://127.0.0.1:8000",
    changeOrigin: true
  },
  "/socket.io": {
    target: process.env.VITE_BACKEND_URL || "http://127.0.0.1:8000",
    changeOrigin: true,
    ws: true
  }
};

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'PyMeet Video Conferencing',
        short_name: 'PyMeet',
        description: 'Modern Video Conferencing Application',
        theme_color: '#050914',
        background_color: '#050914',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        id: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    proxy
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          lucide: ["lucide-react"],
          framer: ["framer-motion"]
        }
      }
    }
  },
  preview: {
    host: true,
    port: 5173,
    proxy,
    allowedHosts: true
  }
});

