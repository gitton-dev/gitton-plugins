import chalk from 'chalk'
import { list as listApi } from '../lib/api.js'

export async function list(options: { dev?: boolean }) {
  try {
    const { pluginsDir, plugins } = await listApi(options)

    console.log(chalk.blue(`Plugins directory: ${pluginsDir}`))
    console.log('')

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
    console.error(chalk.red(`Error: ${(error as Error).message}`))
    process.exit(1)
  }
}
