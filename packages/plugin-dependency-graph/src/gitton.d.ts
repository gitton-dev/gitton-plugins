interface GittonSettings {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  getAll(): Promise<Record<string, unknown>>
}

interface GittonUI {
  showNotification(message: string, type: 'info' | 'warning' | 'error'): void
  openExternal(url: string): Promise<void>
  getTheme(): Promise<'light' | 'dark'>
}

interface GittonFS {
  readFile(path: string): Promise<{ success: boolean; content?: string; error?: string }>
  readdir(path: string): Promise<{ success: boolean; entries?: Array<{ name: string; isDirectory: boolean }>; error?: string }>
  exists(path: string): Promise<{ exists: boolean }>
  stat(path: string): Promise<{ success: boolean; stat?: { size: number; isFile: boolean; isDirectory: boolean }; error?: string }>
}

interface GittonContext {
  repoPath: string
  theme: 'light' | 'dark'
}

interface Gitton {
  settings: GittonSettings
  ui: GittonUI
  fs: GittonFS
  context: GittonContext
}

declare global {
  interface Window {
    gitton: Gitton
  }
  const gitton: Gitton
}

export {}
