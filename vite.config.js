import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.vert', '**/*.frag'], // Include shader files as assets
  base: '/spark-particles/', // For GitHub Pages deployment
})
