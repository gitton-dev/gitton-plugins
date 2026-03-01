import pacote from 'pacote'
import path from 'path'
import fs from 'fs/promises'
import { getPluginsDir, resolvePackageName } from './utils.js'
import { availablePlugins as generatedPlugins } from '../generated/plugins.js'

export interface InstallOptions {
  dev?: boolean
}

export interface InstallResult {
  name: string
  version: string
  displayName: string
  description?: string
  permissions?: string[]
  path: string
}

export interface UninstallOptions {
  dev?: boolean
}

export interface UninstallResult {
  name: string
  path: string
}

export interface ListOptions {
  dev?: boolean
}

export interface PluginInfo {
  name: string
  version: string
  displayName: string
  description?: string
  path: string
}

export interface ListResult {
  pluginsDir: string
  plugins: PluginInfo[]
}

export interface AvailablePlugin {
  name: string
  shortName: string
  version: string
  description: string
}

/**
 * Install a plugin from npm
 */
export async function install(packageName: string, options: InstallOptions = {}): Promise<InstallResult> {
  const pluginsDir = getPluginsDir(options.dev ?? false)
  const fullPackageName = resolvePackageName(packageName)

  // Ensure plugins directory exists
  await fs.mkdir(pluginsDir, { recursive: true })

  // Fetch package manifest to get the actual name
  const manifest = await pacote.manifest(fullPackageName, { fullMetadata: true })
  const pluginDir = path.join(pluginsDir, manifest.name.replace('/', '-'))

  // Check if it's a valid Gitton plugin
  const gittonConfig = (manifest as Record<string, unknown>).gitton as Record<string, unknown> | undefined
  if (!gittonConfig) {
    throw new Error(`${fullPackageName} is not a valid Gitton plugin (missing "gitton" field in package.json)`)
  }

  // Remove existing installation if any
  await fs.rm(pluginDir, { recursive: true, force: true })

  // Extract package to plugins directory
  await pacote.extract(fullPackageName, pluginDir)

  return {
    name: manifest.name,
    version: manifest.version,
    displayName: gittonConfig.displayName as string,
    description: (gittonConfig.description as string) || (manifest.description as string),
    permissions: gittonConfig.permissions as string[] | undefined,
    path: pluginDir
  }
}

/**
 * Uninstall a plugin
 */
export async function uninstall(packageName: string, options: UninstallOptions = {}): Promise<UninstallResult> {
  const pluginsDir = getPluginsDir(options.dev ?? false)
  const fullPackageName = resolvePackageName(packageName)

  // Find the plugin directory
  const pluginDirName = fullPackageName.replace('/', '-')
  const pluginDir = path.join(pluginsDir, pluginDirName)

  // Check if plugin exists
  try {
    await fs.access(pluginDir)
  } catch {
    throw new Error(`Plugin "${packageName}" is not installed`)
  }

  // Remove the plugin directory
  await fs.rm(pluginDir, { recursive: true, force: true })

  return {
    name: fullPackageName,
    path: pluginDir
  }
}

/**
 * List installed plugins
 */
export async function list(options: ListOptions = {}): Promise<ListResult> {
  const pluginsDir = getPluginsDir(options.dev ?? false)
  const plugins: PluginInfo[] = []

  try {
    const entries = await fs.readdir(pluginsDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue

      const pluginPath = path.join(pluginsDir, entry.name)
      const packageJsonPath = path.join(pluginPath, 'package.json')

      try {
        const content = await fs.readFile(packageJsonPath, 'utf-8')
        const pkg = JSON.parse(content)

        if (pkg.gitton) {
          plugins.push({
            name: pkg.name,
            version: pkg.version,
            displayName: pkg.gitton.displayName || pkg.name,
            description: pkg.gitton.description || pkg.description || '',
            path: pluginPath
          })
        }
      } catch {
        // Skip invalid plugins
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
    // Directory doesn't exist, return empty list
  }

  return {
    pluginsDir,
    plugins
  }
}

/**
 * Search available plugins
 */
export function search(query?: string): AvailablePlugin[] {
  let plugins = generatedPlugins

  if (query) {
    const q = query.toLowerCase()
    plugins = plugins.filter(
      (p) =>
        p.shortName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    )
  }

  return plugins
}

/**
 * Get available plugins (alias for search with no query)
 */
export function getAvailablePlugins(): AvailablePlugin[] {
  return generatedPlugins
}

// Re-export utilities
export { getPluginsDir, resolvePackageName }
