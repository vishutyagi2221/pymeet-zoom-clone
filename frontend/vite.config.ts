import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
  plugins: [react()],
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

