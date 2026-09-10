import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works on any GitHub Pages path
// (user.github.io/<repo>/) without hard-coding the repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', assetsDir: 'assets' },
})
