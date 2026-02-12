import { defineConfig } from 'vite'
import { resolve } from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['crypto', 'stream', 'buffer', 'process', 'events', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  base: './',
  build: {
    outDir: 'ui',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        markdown: resolve(__dirname, 'src/markdown/index.html'),
        settings: resolve(__dirname, 'src/settings/index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
