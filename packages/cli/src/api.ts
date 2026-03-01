/**
 * @gitton-dev/cli - Node.js API
 *
 * This module provides programmatic access to Gitton plugin management.
 *
 * @example
 * ```typescript
 * import { install, uninstall, list, search, getPluginsDir } from '@gitton-dev/cli'
 *
 * // Install a plugin
 * const result = await install('github-actions')
 * console.log(`Installed ${result.name}@${result.version}`)
 *
 * // List installed plugins
 * const { plugins } = await list()
 * console.log(plugins)
 *
 * // Search available plugins
 * const available = search('github')
 * console.log(available)
 * ```
 */

export {
  // Core functions
  install,
  uninstall,
  list,
  search,
  getAvailablePlugins,

  // Utilities
  getPluginsDir,
  resolvePackageName,

  // Types
  type InstallOptions,
  type InstallResult,
  type UninstallOptions,
  type UninstallResult,
  type ListOptions,
  type ListResult,
  type PluginInfo,
  type AvailablePlugin
} from './lib/api.js'
