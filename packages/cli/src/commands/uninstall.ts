import chalk from 'chalk'
import { uninstall as uninstallApi, list as listApi } from '../lib/api.js'

export async function uninstall(packageName: string, options: { dev?: boolean }) {
  console.log(chalk.blue(`Uninstalling ${packageName}...`))

  try {
    const result = await uninstallApi(packageName, options)

    console.log(chalk.green(`✓ Uninstalled ${result.name}`))
    console.log('')
    console.log(chalk.yellow('Note: Restart Gitton to apply changes.'))
  } catch (error) {
    if ((error as Error).message.includes('is not installed')) {
      console.error(chalk.red(`Error: Plugin "${packageName}" is not installed`))

      // List installed plugins
      console.log('')
      console.log('Installed plugins:')
      try {
        const { plugins } = await listApi(options)
        if (plugins.length === 0) {
          console.log(chalk.gray('  (none)'))
        } else {
          for (const plugin of plugins) {
            console.log(chalk.gray(`  - ${plugin.name}`))
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
