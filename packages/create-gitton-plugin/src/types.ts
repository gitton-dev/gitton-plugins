export type ExtensionPoint = 'sidebar' | 'settingsTab' | 'repositorySettings' | 'markdown' | 'editor'

export type Permission =
  | 'ui:sidebar'
  | 'ui:settings'
  | 'ui:repositorySettings'
  | 'ui:markdown'
  | 'ui:editor'
  | 'settings:read'
  | 'settings:write'
  | 'network:fetch'
  | 'git:read'
  | 'git:write'
  | 'git:hooks'

export interface PluginConfig {
  name: string
  displayName: string
  description: string
  author: string
  extensionPoints: ExtensionPoint[]
  permissions: Permission[]
  useTailwind: boolean
  useReact: boolean
}

export interface CLIOptions {
  name?: string
  displayName?: string
  description?: string
  author?: string
  extensionPoints?: string
  permissions?: string
  tailwind?: boolean
  react?: boolean
  yes?: boolean
}
