import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const devProxyTarget = process.env.VITE_DEV_API_PROXY || "http://localhost:8000";

const proxy = {
  "/api": {
    target: devProxyTarget,
    changeOrigin: true
  },
  "/socket.io": {
    target: devProxyTarget,
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
  preview: {
    host: true,
    port: 5173,
    proxy,
    allowedHosts: true
  }
});

