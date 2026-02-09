import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Base path for GitHub Pages serving from /dashboard/dist/
export default defineConfig({
  base: '/',
  plugins: [react()],
})
