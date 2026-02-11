import { defineConfig } from 'vite'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

/**
 * Vite config for building the markdown renderer
 *
 * This builds src/renderer.ts into dist/renderer.js as a self-executing script
 * that populates the `exports` object with a `render` function.
 *
 * The output format is designed to work with Gitton's plugin loader which does:
 *   const moduleExports = {}
 *   const moduleFunc = new Function('exports', code)
 *   moduleFunc(moduleExports)
 *   // Then uses moduleExports.render
 */
export default defineConfig({
  plugins: [
    nodePolyfills({
      // Enable all polyfills needed for zenn-markdown-html
      include: ['crypto', 'stream', 'buffer', 'process', 'events', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/renderer.ts'),
      name: 'ZennMarkdownRenderer',
      formats: ['cjs'],
      fileName: () => 'renderer.js'
    },
    outDir: 'dist',
    emptyDirOnBuild: false,
    minify: true,
    rollupOptions: {
      output: {
        // Export as CommonJS so it works with `new Function('exports', code)`
        format: 'cjs',
        exports: 'named'
      }
    }
  }
})
