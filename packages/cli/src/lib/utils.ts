import path from 'path'
import os from 'os'

export function getPluginsDir(isDev: boolean): string {
  const platform = os.platform()
  const homeDir = os.homedir()

  let appDataDir: string
  if (platform === 'darwin') {
    appDataDir = path.join(homeDir, 'Library', 'Application Support', 'gitton')
  } else if (platform === 'win32') {
    appDataDir = path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'gitton')
  } else {
    appDataDir = path.join(homeDir, '.config', 'gitton')
  }

  return path.join(appDataDir, isDev ? 'plugins-dev' : 'plugins')
}

/**
 * Resolve shorthand package name to full npm package name
 * e.g., "github-actions" -> "@gitton-dev/plugin-github-actions"
 */
export function resolvePackageName(packageName: string): string {
  if (!packageName.startsWith('@') && !packageName.includes('/')) {
    return `@gitton-dev/plugin-${packageName}`
  }
  return packageName
}
