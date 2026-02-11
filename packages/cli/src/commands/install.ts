import pacote from 'pacote'
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

export async function install(packageName: string, options: { dev?: boolean }) {
  const pluginsDir = getPluginsDir(options.dev ?? false)

  console.log(chalk.blue(`Installing ${packageName}...`))

  try {
    // Ensure plugins directory exists
    await fs.mkdir(pluginsDir, { recursive: true })

    // Resolve package name (support shorthand like "github-actions" -> "@gitton-dev/plugin-github-actions")
    let fullPackageName = packageName
    if (!packageName.startsWith('@') && !packageName.includes('/')) {
      // Try @gitton-dev/plugin-{name} first
      fullPackageName = `@gitton-dev/plugin-${packageName}`
    }

    // Fetch package manifest to get the actual name
    console.log(chalk.gray(`Fetching ${fullPackageName}...`))

    const manifest = await pacote.manifest(fullPackageName, { fullMetadata: true })
    const pluginDir = path.join(pluginsDir, manifest.name.replace('/', '-'))

    // Check if it's a valid Gitton plugin
    const gittonConfig = (manifest as any).gitton
    if (!gittonConfig) {
      console.error(chalk.red(`Error: ${fullPackageName} is not a valid Gitton plugin (missing "gitton" field in package.json)`))
      process.exit(1)
    }

    // Remove existing installation if any
    await fs.rm(pluginDir, { recursive: true, force: true })

    // Extract package to plugins directory
    console.log(chalk.gray(`Extracting to ${pluginDir}...`))
    await pacote.extract(fullPackageName, pluginDir)

    console.log(chalk.green(`✓ Installed ${manifest.name}@${manifest.version}`))
    console.log(chalk.gray(`  Location: ${pluginDir}`))
    console.log(chalk.gray(`  Display Name: ${gittonConfig.displayName}`))

    if (gittonConfig.permissions?.length > 0) {
      console.log(chalk.gray(`  Permissions: ${gittonConfig.permissions.join(', ')}`))
    }

    console.log('')
    console.log(chalk.yellow('Note: Restart Gitton to load the plugin.'))
  } catch (error) {
    if ((error as any).code === 'E404') {
      console.error(chalk.red(`Error: Package "${packageName}" not found on npm`))

      // Suggest alternatives
      if (!packageName.startsWith('@gitton-dev/')) {
        console.log(chalk.gray(`Did you mean @gitton-dev/plugin-${packageName}?`))
      }
    } else {
      console.error(chalk.red(`Error: ${(error as Error).message}`))
    }
    process.exit(1)
  }
}
