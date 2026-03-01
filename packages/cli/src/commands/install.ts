import chalk from 'chalk'
import { install as installApi } from '../lib/api.js'

export async function install(packageName: string, options: { dev?: boolean }) {
  console.log(chalk.blue(`Installing ${packageName}...`))

  try {
    const result = await installApi(packageName, options)

    console.log(chalk.green(`✓ Installed ${result.name}@${result.version}`))
    console.log(chalk.gray(`  Location: ${result.path}`))
    console.log(chalk.gray(`  Display Name: ${result.displayName}`))

    if (result.permissions && result.permissions.length > 0) {
      console.log(chalk.gray(`  Permissions: ${result.permissions.join(', ')}`))
    }

    console.log('')
    console.log(chalk.yellow('Note: Restart Gitton to load the plugin.'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'E404') {
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
