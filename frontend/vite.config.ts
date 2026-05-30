import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'

const apiProxy = {
  '/api': { target: proxyTarget, changeOrigin: true },
  '/health': { target: proxyTarget, changeOrigin: true },
  '/uploads': { target: proxyTarget, changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 8080,
    // Railway (and similar) proxy with a public Host header — required for vite preview in prod.
    allowedHosts: true,
    // Same-origin /api in production — avoids ERR_BLOCKED_BY_ORB on <video src=".../stream">
    proxy: apiProxy,
  },
})