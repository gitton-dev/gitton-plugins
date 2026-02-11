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

export async function list(options: { dev?: boolean }) {
  const pluginsDir = getPluginsDir(options.dev ?? false)

  console.log(chalk.blue(`Plugins directory: ${pluginsDir}`))
  console.log('')

  try {
    const entries = await fs.readdir(pluginsDir, { withFileTypes: true })
    const plugins: { name: string; version: string; displayName: string; description: string }[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue

      const packageJsonPath = path.join(pluginsDir, entry.name, 'package.json')
      try {
        const content = await fs.readFile(packageJsonPath, 'utf-8')
        const pkg = JSON.parse(content)

        if (pkg.gitton) {
          plugins.push({
            name: pkg.name,
            version: pkg.version,
            displayName: pkg.gitton.displayName || pkg.name,
            description: pkg.gitton.description || pkg.description || ''
          })
        }
      } catch {
        // Skip invalid plugins
      }
    }

    if (plugins.length === 0) {
      console.log(chalk.gray('No plugins installed.'))
      console.log('')
      console.log('Install plugins with:')
      console.log(chalk.cyan('  gitton install <package-name>'))
      console.log('')
      console.log('Example:')
      console.log(chalk.cyan('  gitton install github-actions'))
      return
    }

    console.log(`Found ${plugins.length} plugin(s):`)
    console.log('')

    for (const plugin of plugins) {
      console.log(chalk.green(`  ${plugin.displayName}`))
      console.log(chalk.gray(`    ${plugin.name}@${plugin.version}`))
      if (plugin.description) {
        console.log(chalk.gray(`    ${plugin.description}`))
      }
      console.log('')
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(chalk.gray('No plugins installed.'))
    } else {
      console.error(chalk.red(`Error: ${(error as Error).message}`))
      process.exit(1)
    }
  }
}
