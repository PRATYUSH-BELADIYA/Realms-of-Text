import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: "/",            // 🔥 required for correct routing on Vercel
  build: {
    outDir: "dist",     // 🔥 Vercel looks for this by default
  },
})
