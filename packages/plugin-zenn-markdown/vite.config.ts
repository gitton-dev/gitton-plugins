import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vite config for building the settings UI
 */
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'ui/src/settings'),
  build: {
    outDir: path.resolve(__dirname, 'dist/settings'),
    emptyDirOnBuild: true
  }
})
