export interface GhRunResult {
  success: boolean
  stdout: string
  stderr: string
  error?: string
}

export interface GittonSettings {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  getAll(): Promise<Record<string, unknown>>
}

export interface GittonUI {
  showNotification(message: string, type?: 'info' | 'error' | 'warning'): void
  openExternal(url: string): Promise<{ success: boolean }>
  getTheme(): Promise<{ theme: 'light' | 'dark' }>
}

export interface GittonGh {
  run(args: string[]): Promise<GhRunResult>
}

export interface GittonContext {
  repoPath: string | null
  theme: 'light' | 'dark'
}

export interface GittonAPI {
  pluginId: string
  settings: GittonSettings
  ui: GittonUI
  gh: GittonGh
  context: GittonContext
}

declare global {
  interface Window {
    gitton: GittonAPI
  }
}
