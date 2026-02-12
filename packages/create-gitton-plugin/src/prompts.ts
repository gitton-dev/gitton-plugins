import * as p from '@clack/prompts'
import type { CLIOptions, ExtensionPoint, Permission, PluginConfig } from './types.js'

const EXTENSION_POINTS: { value: ExtensionPoint; label: string; hint: string }[] = [
  { value: 'sidebar', label: 'Sidebar Panel', hint: 'Add a panel to the sidebar' },
  { value: 'settingsTab', label: 'Settings Tab', hint: 'Add a tab in the settings page' },
  { value: 'repositorySettings', label: 'Repository Settings', hint: 'Add settings specific to repository' },
  { value: 'markdown', label: 'Markdown Renderer', hint: 'Custom markdown rendering' },
  { value: 'editor', label: 'Editor', hint: 'Custom file editor' },
]

const PERMISSIONS: { value: Permission; label: string; hint: string }[] = [
  { value: 'ui:sidebar', label: 'UI: Sidebar', hint: 'Display UI in sidebar' },
  { value: 'ui:settings', label: 'UI: Settings', hint: 'Display UI in settings' },
  { value: 'ui:repositorySettings', label: 'UI: Repository Settings', hint: 'Display UI in repository settings' },
  { value: 'ui:markdown', label: 'UI: Markdown', hint: 'Render markdown content' },
  { value: 'ui:editor', label: 'UI: Editor', hint: 'Provide custom editor' },
  { value: 'settings:read', label: 'Settings: Read', hint: 'Read plugin settings' },
  { value: 'settings:write', label: 'Settings: Write', hint: 'Write plugin settings' },
  { value: 'network:fetch', label: 'Network: Fetch', hint: 'Make network requests' },
  { value: 'git:read', label: 'Git: Read', hint: 'Read git repository' },
  { value: 'git:write', label: 'Git: Write', hint: 'Write to git repository' },
  { value: 'git:hooks', label: 'Git: Hooks', hint: 'Manage git hooks' },
]

function getDefaultPermissions(extensionPoints: ExtensionPoint[]): Permission[] {
  const permissions: Permission[] = []

  for (const ep of extensionPoints) {
    switch (ep) {
      case 'sidebar':
        permissions.push('ui:sidebar')
        break
      case 'settingsTab':
        permissions.push('ui:settings')
        break
      case 'repositorySettings':
        permissions.push('ui:repositorySettings')
        break
      case 'markdown':
        permissions.push('ui:markdown')
        break
      case 'editor':
        permissions.push('ui:editor')
        break
    }
  }

  return [...new Set(permissions)]
}

export async function runPrompts(options: CLIOptions): Promise<PluginConfig | null> {
  p.intro('Create Gitton Plugin')

  // If --yes flag is provided, use defaults
  if (options.yes) {
    const name = options.name || 'my-plugin'
    const extensionPoints = options.extensionPoints
      ? (options.extensionPoints.split(',') as ExtensionPoint[])
      : ['sidebar']
    const permissions = options.permissions
      ? (options.permissions.split(',') as Permission[])
      : getDefaultPermissions(extensionPoints as ExtensionPoint[])

    return {
      name,
      displayName: options.displayName || name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: options.description || `A Gitton plugin`,
      author: options.author || 'Your Name',
      extensionPoints: extensionPoints as ExtensionPoint[],
      permissions: permissions as Permission[],
      useTailwind: options.tailwind ?? true,
      useReact: options.react ?? true,
    }
  }

  const name = options.name ?? await p.text({
    message: 'Plugin name (kebab-case):',
    placeholder: 'my-awesome-plugin',
    validate: (value) => {
      if (!value) return 'Name is required'
      if (!/^[a-z][a-z0-9-]*$/.test(value)) {
        return 'Name must be kebab-case (lowercase letters, numbers, hyphens)'
      }
      return undefined
    },
  })

  if (p.isCancel(name)) {
    p.cancel('Operation cancelled')
    return null
  }

  const displayName = options.displayName ?? await p.text({
    message: 'Display name:',
    placeholder: 'My Awesome Plugin',
    initialValue: String(name).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  })

  if (p.isCancel(displayName)) {
    p.cancel('Operation cancelled')
    return null
  }

  const description = options.description ?? await p.text({
    message: 'Description:',
    placeholder: 'A brief description of your plugin',
  })

  if (p.isCancel(description)) {
    p.cancel('Operation cancelled')
    return null
  }

  const author = options.author ?? await p.text({
    message: 'Author:',
    placeholder: 'Your Name',
  })

  if (p.isCancel(author)) {
    p.cancel('Operation cancelled')
    return null
  }

  const extensionPoints = options.extensionPoints
    ? (options.extensionPoints.split(',') as ExtensionPoint[])
    : await p.multiselect({
        message: 'Extension points (select with space):',
        options: EXTENSION_POINTS,
        required: true,
      })

  if (p.isCancel(extensionPoints)) {
    p.cancel('Operation cancelled')
    return null
  }

  const defaultPermissions = getDefaultPermissions(extensionPoints as ExtensionPoint[])
  const permissions = options.permissions
    ? (options.permissions.split(',') as Permission[])
    : await p.multiselect({
        message: 'Permissions (select with space):',
        options: PERMISSIONS,
        initialValues: defaultPermissions,
        required: true,
      })

  if (p.isCancel(permissions)) {
    p.cancel('Operation cancelled')
    return null
  }

  const useReact = options.react ?? await p.confirm({
    message: 'Use React?',
    initialValue: true,
  })

  if (p.isCancel(useReact)) {
    p.cancel('Operation cancelled')
    return null
  }

  const useTailwind = options.tailwind ?? await p.confirm({
    message: 'Use Tailwind CSS?',
    initialValue: true,
  })

  if (p.isCancel(useTailwind)) {
    p.cancel('Operation cancelled')
    return null
  }

  return {
    name: String(name),
    displayName: String(displayName),
    description: String(description),
    author: String(author),
    extensionPoints: extensionPoints as ExtensionPoint[],
    permissions: permissions as Permission[],
    useTailwind: Boolean(useTailwind),
    useReact: Boolean(useReact),
  }
}
