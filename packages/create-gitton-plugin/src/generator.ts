import fs from 'fs/promises'
import path from 'path'
import type { PluginConfig, ExtensionPoint } from './types.js'

export async function generatePlugin(config: PluginConfig, outputDir: string): Promise<void> {
  const pluginDir = path.join(outputDir, `plugin-${config.name}`)

  // Create directories
  await fs.mkdir(pluginDir, { recursive: true })
  await fs.mkdir(path.join(pluginDir, 'src'), { recursive: true })

  // Generate package.json
  await fs.writeFile(
    path.join(pluginDir, 'package.json'),
    generatePackageJson(config)
  )

  // Generate tsconfig.json
  await fs.writeFile(
    path.join(pluginDir, 'tsconfig.json'),
    generateTsConfig()
  )

  // Generate vite.config.ts
  await fs.writeFile(
    path.join(pluginDir, 'vite.config.ts'),
    generateViteConfig(config)
  )

  // Generate Tailwind and PostCSS configs if needed
  if (config.useTailwind) {
    await fs.writeFile(
      path.join(pluginDir, 'tailwind.config.js'),
      generateTailwindConfig()
    )
    await fs.writeFile(
      path.join(pluginDir, 'postcss.config.js'),
      generatePostcssConfig()
    )
    await fs.writeFile(
      path.join(pluginDir, 'src', 'globals.css'),
      generateGlobalsCss()
    )
  }

  // Generate types
  await fs.mkdir(path.join(pluginDir, 'src', 'types'), { recursive: true })
  await fs.writeFile(
    path.join(pluginDir, 'src', 'types', 'gitton.ts'),
    generateGittonTypes()
  )

  // Generate lib/utils.ts if using Tailwind
  if (config.useTailwind) {
    await fs.mkdir(path.join(pluginDir, 'src', 'lib'), { recursive: true })
    await fs.writeFile(
      path.join(pluginDir, 'src', 'lib', 'utils.ts'),
      generateUtils()
    )
  }

  // Generate .gitignore
  await fs.writeFile(
    path.join(pluginDir, '.gitignore'),
    generateGitignore()
  )

  // Generate .npmignore
  await fs.writeFile(
    path.join(pluginDir, '.npmignore'),
    generateNpmignore()
  )

  // Generate entry points for each extension point
  for (const ep of config.extensionPoints) {
    await generateExtensionPoint(pluginDir, ep, config)
  }
}

function generatePackageJson(config: PluginConfig): string {
  const gittonConfig: Record<string, unknown> = {
    displayName: config.displayName,
    version: '0.0.0',
    description: config.description,
    author: config.author,
    permissions: config.permissions,
    extensionPoints: {},
  }

  const extensionPoints: Record<string, unknown> = {}

  for (const ep of config.extensionPoints) {
    switch (ep) {
      case 'sidebar':
        extensionPoints.sidebar = {
          entry: 'ui/src/sidebar/index.html',
          icon: 'puzzle',
          position: 'bottom',
        }
        break
      case 'settingsTab':
        extensionPoints.settingsTab = {
          entry: 'ui/src/settings/index.html',
          label: config.displayName,
        }
        break
      case 'repositorySettings':
        extensionPoints.repositorySettings = {
          entry: 'ui/src/repository-settings/index.html',
          label: config.displayName,
        }
        break
      case 'markdown':
        extensionPoints.markdown = {
          name: config.displayName,
          filePatterns: ['*.md'],
          priority: 10,
          entry: 'ui/src/markdown/index.html',
        }
        break
      case 'editor':
        extensionPoints.editor = {
          name: config.displayName,
          filePatterns: ['*'],
          priority: 1,
          entry: 'ui/src/editor/index.html',
        }
        break
    }
  }

  gittonConfig.extensionPoints = extensionPoints

  const devDependencies: Record<string, string> = {
    typescript: '^5.7.3',
    vite: '^6.0.11',
  }

  const dependencies: Record<string, string> = {}

  if (config.useReact) {
    devDependencies['@types/react'] = '^18.3.18'
    devDependencies['@types/react-dom'] = '^18.3.5'
    devDependencies['@vitejs/plugin-react'] = '^4.3.4'
    dependencies.react = '^18.3.1'
    dependencies['react-dom'] = '^18.3.1'
  }

  if (config.useTailwind) {
    devDependencies.autoprefixer = '^10.4.20'
    devDependencies.postcss = '^8.5.1'
    devDependencies.tailwindcss = '^3.4.17'
    dependencies.clsx = '^2.1.1'
    dependencies['tailwind-merge'] = '^2.6.0'
  }

  const pkg = {
    name: `@gitton-dev/plugin-${config.name}`,
    version: '0.0.1',
    description: config.description,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      clean: 'rm -rf dist ui node_modules/.vite',
    },
    gitton: gittonConfig,
    files: ['ui', 'package.json'],
    keywords: ['gitton', 'gitton-plugin', config.name],
    author: config.author,
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git@github.com:gitton-dev/gitton-plugins.git',
      directory: `packages/plugin-${config.name}`,
    },
    bugs: {
      url: 'https://github.com/gitton-dev/gitton-plugins/issues',
    },
    homepage: 'https://jsers.dev/service/gitton',
    devDependencies,
    dependencies,
  }

  return JSON.stringify(pkg, null, 2) + '\n'
}

function generateTsConfig(): string {
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      baseUrl: '.',
      paths: {
        '@/*': ['src/*'],
      },
    },
    include: ['src'],
  }

  return JSON.stringify(tsconfig, null, 2) + '\n'
}

function generateViteConfig(config: PluginConfig): string {
  const inputs: string[] = []
  for (const ep of config.extensionPoints) {
    switch (ep) {
      case 'sidebar':
        inputs.push(`sidebar: resolve(__dirname, 'src/sidebar/index.html')`)
        break
      case 'settingsTab':
        inputs.push(`settings: resolve(__dirname, 'src/settings/index.html')`)
        break
      case 'repositorySettings':
        inputs.push(`repositorySettings: resolve(__dirname, 'src/repository-settings/index.html')`)
        break
      case 'markdown':
        inputs.push(`markdown: resolve(__dirname, 'src/markdown/index.html')`)
        break
      case 'editor':
        inputs.push(`editor: resolve(__dirname, 'src/editor/index.html')`)
        break
    }
  }

  const plugins = config.useReact ? `[react()]` : `[]`
  const imports = config.useReact
    ? `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport { resolve } from 'path'`
    : `import { defineConfig } from 'vite'\nimport { resolve } from 'path'`

  return `${imports}

export default defineConfig({
  plugins: ${plugins},
  base: './',
  server: {
    port: 5273
  },
  build: {
    outDir: 'ui',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ${inputs.join(',\n        ')}
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
`
}

function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: []
}
`
}

function generatePostcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
`
}

function generateGitignore(): string {
  return `# Dependencies
node_modules/

# Build output
dist/
ui/

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Cache
.vite/
*.tsbuildinfo
`
}

function generateNpmignore(): string {
  return `# Source files (ui/ contains built assets, so don't ignore it)
src/

# Config files
tsconfig.json
vite.config.ts
tailwind.config.js
postcss.config.js
.gitignore

# Development
node_modules/
.vite/
*.tsbuildinfo

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
`
}

function generateGlobalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  :root.dark,
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --ring: 0 0% 83.1%;
  }
}

@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
}
`
}

function generateGittonTypes(): string {
  return `export interface GhRunResult {
  success: boolean
  stdout: string
  stderr: string
  error?: string
}

export interface FsResult {
  success: boolean
  error?: string
}

export interface FsReadResult extends FsResult {
  content?: string
}

export interface FsReaddirEntry {
  name: string
  isDirectory: boolean
  isFile: boolean
}

export interface FsReaddirResult extends FsResult {
  entries: FsReaddirEntry[]
}

export interface FsExistsResult {
  exists: boolean
}

export interface FsStatResult extends FsResult {
  stat?: {
    size: number
    mode: number
    isFile: boolean
    isDirectory: boolean
    mtime: string
  }
}

export interface GittonSettings {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  getAll(): Promise<Record<string, unknown>>
}

export interface GittonUI {
  showNotification(message: string, type?: 'info' | 'error' | 'warning'): void
  openExternal(url: string): Promise<{ success: boolean }>
  getTheme(): Promise<{ theme: 'light' | 'dark' }>
}

export interface GittonGh {
  run(args: string[]): Promise<GhRunResult>
}

export interface GittonFs {
  readFile(path: string): Promise<FsReadResult>
  writeFile(path: string, content: string): Promise<FsResult>
  readdir(path: string): Promise<FsReaddirResult>
  exists(path: string): Promise<FsExistsResult>
  unlink(path: string): Promise<FsResult>
  chmod(path: string, mode: number): Promise<FsResult>
  stat(path: string): Promise<FsStatResult>
}

export interface GittonContext {
  repoPath: string | null
  theme: 'light' | 'dark'
}

export interface GittonAPI {
  pluginId: string
  settings: GittonSettings
  ui: GittonUI
  gh: GittonGh
  fs: GittonFs
  context: GittonContext
}

declare global {
  interface Window {
    gitton: GittonAPI
  }
}
`
}

function generateUtils(): string {
  return `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
}

async function generateExtensionPoint(
  pluginDir: string,
  extensionPoint: ExtensionPoint,
  config: PluginConfig
): Promise<void> {
  const dirName = getExtensionPointDir(extensionPoint)
  const dir = path.join(pluginDir, 'src', dirName)
  await fs.mkdir(dir, { recursive: true })

  // Generate index.html
  await fs.writeFile(
    path.join(dir, 'index.html'),
    generateIndexHtml(config.displayName, extensionPoint)
  )

  // Generate main file
  if (config.useReact) {
    await fs.writeFile(
      path.join(dir, 'main.tsx'),
      generateReactMain(config, extensionPoint)
    )

    // Generate component directory and main component
    await fs.mkdir(path.join(dir, 'components'), { recursive: true })
    await fs.writeFile(
      path.join(dir, 'components', `${getComponentName(extensionPoint)}.tsx`),
      generateReactComponent(config, extensionPoint)
    )
  } else {
    await fs.writeFile(
      path.join(dir, 'main.ts'),
      generateVanillaMain(config, extensionPoint)
    )
  }
}

function getExtensionPointDir(ep: ExtensionPoint): string {
  switch (ep) {
    case 'sidebar':
      return 'sidebar'
    case 'settingsTab':
      return 'settings'
    case 'repositorySettings':
      return 'repository-settings'
    case 'markdown':
      return 'markdown'
    case 'editor':
      return 'editor'
  }
}

function getComponentName(ep: ExtensionPoint): string {
  switch (ep) {
    case 'sidebar':
      return 'Sidebar'
    case 'settingsTab':
      return 'Settings'
    case 'repositorySettings':
      return 'RepositorySettings'
    case 'markdown':
      return 'MarkdownRenderer'
    case 'editor':
      return 'Editor'
  }
}

function generateIndexHtml(displayName: string, ep: ExtensionPoint): string {
  const title = `${displayName} - ${getComponentName(ep)}`
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
`
}

function generateReactMain(config: PluginConfig, ep: ExtensionPoint): string {
  const componentName = getComponentName(ep)
  const cssImport = config.useTailwind ? `import '../globals.css'\n` : ''

  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import { ${componentName} } from './components/${componentName}'
${cssImport}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <${componentName} />
  </React.StrictMode>
)
`
}

function generateReactComponent(config: PluginConfig, ep: ExtensionPoint): string {
  const componentName = getComponentName(ep)
  const baseClasses = config.useTailwind ? ' className="p-4"' : ''

  return `export function ${componentName}() {
  return (
    <div${baseClasses}>
      <h1>${config.displayName}</h1>
      <p>${config.description}</p>
    </div>
  )
}
`
}

function generateVanillaMain(config: PluginConfig, _ep: ExtensionPoint): string {
  return `const root = document.getElementById('root')

if (root) {
  root.innerHTML = \`
    <div>
      <h1>${config.displayName}</h1>
      <p>${config.description}</p>
    </div>
  \`
}
`
}
