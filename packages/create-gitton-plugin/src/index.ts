#!/usr/bin/env node

import { Command } from 'commander'
import * as p from '@clack/prompts'
import chalk from 'chalk'
import path from 'path'
import { runPrompts } from './prompts.js'
import { generatePlugin } from './generator.js'
import type { CLIOptions } from './types.js'

const program = new Command()

program
  .name('create-gitton-plugin')
  .description('Create a new Gitton plugin')
  .version('0.0.1')
  .argument('[directory]', 'Output directory', '.')
  .option('-n, --name <name>', 'Plugin name (kebab-case)')
  .option('-d, --display-name <displayName>', 'Display name')
  .option('--description <description>', 'Plugin description')
  .option('-a, --author <author>', 'Author name')
  .option('-e, --extension-points <points>', 'Extension points (comma-separated: sidebar,settingsTab,repositorySettings,markdown,editor)')
  .option('-p, --permissions <permissions>', 'Permissions (comma-separated)')
  .option('--tailwind', 'Use Tailwind CSS')
  .option('--no-tailwind', 'Do not use Tailwind CSS')
  .option('--react', 'Use React')
  .option('--no-react', 'Do not use React')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (directory: string, options: CLIOptions) => {
    try {
      const config = await runPrompts(options)

      if (!config) {
        process.exit(1)
      }

      const outputDir = path.resolve(directory)

      const spinner = p.spinner()
      spinner.start('Generating plugin...')

      await generatePlugin(config, outputDir)

      spinner.stop('Plugin generated!')

      const pluginDir = path.join(outputDir, `plugin-${config.name}`)

      p.note(
        [
          `${chalk.green('Plugin created at:')} ${pluginDir}`,
          '',
          `${chalk.cyan('Next steps:')}`,
          `  cd plugin-${config.name}`,
          '  pnpm install',
          '  pnpm dev',
        ].join('\n'),
        'Done!'
      )

      p.outro('Happy coding!')
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`))
      process.exit(1)
    }
  })

program.parse()
