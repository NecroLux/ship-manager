import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Deployed to GitHub Pages with Actions (root level)
export default defineConfig({
  base: '/ship-manager/',
  plugins: [react()],
})
