import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config. `host: true` exposes the dev server on your LAN
// so you can open it from your phone's browser.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
