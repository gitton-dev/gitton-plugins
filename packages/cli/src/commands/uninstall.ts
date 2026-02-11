import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import chalk from 'chalk'

function getPluginsDir(isDev: boolean): string {
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

export async function uninstall(packageName: string, options: { dev?: boolean }) {
  const pluginsDir = getPluginsDir(options.dev ?? false)

  // Normalize package name
  let searchName = packageName
  if (!packageName.startsWith('@') && !packageName.includes('/')) {
    searchName = `@gitton-dev/plugin-${packageName}`
  }

  // Find the plugin directory
  const pluginDirName = searchName.replace('/', '-')
  const pluginDir = path.join(pluginsDir, pluginDirName)

  try {
    // Check if plugin exists
    await fs.access(pluginDir)

    // Read plugin info before deleting
    try {
      const packageJsonPath = path.join(pluginDir, 'package.json')
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const pkg = JSON.parse(content)
      console.log(chalk.blue(`Uninstalling ${pkg.gitton?.displayName || pkg.name}...`))
    } catch {
      console.log(chalk.blue(`Uninstalling ${searchName}...`))
    }

    // Remove the plugin directory
    await fs.rm(pluginDir, { recursive: true, force: true })

    console.log(chalk.green(`✓ Uninstalled ${searchName}`))
    console.log('')
    console.log(chalk.yellow('Note: Restart Gitton to apply changes.'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(chalk.red(`Error: Plugin "${packageName}" is not installed`))

      // List installed plugins
      console.log('')
      console.log('Installed plugins:')
      try {
        const entries = await fs.readdir(pluginsDir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            console.log(chalk.gray(`  - ${entry.name}`))
          }
        }
      } catch {
        console.log(chalk.gray('  (none)'))
      }
    } else {
      console.error(chalk.red(`Error: ${(error as Error).message}`))
    }
    process.exit(1)
  }
}
