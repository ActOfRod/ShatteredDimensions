import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config. `host: true` exposes the dev server on your LAN
// so you can open it from your phone's browser.
// `base: './'` makes all built asset URLs relative, so the same build
// works on any host (Netlify, Vercel, Cloudflare Pages, GitHub Pages
// project sites served under /repo-name/, or a plain file:// open).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
