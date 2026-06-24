import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const proxy = {
  "/api": {
    target: "http://backend:8000",
    changeOrigin: true
  },
  "/socket.io": {
    target: "http://backend:8000",
    changeOrigin: true,
    ws: true
  }
};

export default defineConfig({
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

