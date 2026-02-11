export interface GhRunResult {
  success: boolean
  stdout: string
  stderr: string
  error?: string
}

export interface FsResult {
  success: boolean
  error?: string
}

export interface FsReadResult extends FsResult {
  content?: string
}

export interface FsReaddirEntry {
  name: string
  isDirectory: boolean
  isFile: boolean
}

export interface FsReaddirResult extends FsResult {
  entries: FsReaddirEntry[]
}

export interface FsExistsResult {
  exists: boolean
}

export interface FsStatResult extends FsResult {
  stat?: {
    size: number
    mode: number
    isFile: boolean
    isDirectory: boolean
    mtime: string
  }
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

export interface GittonFs {
  readFile(path: string): Promise<FsReadResult>
  writeFile(path: string, content: string): Promise<FsResult>
  readdir(path: string): Promise<FsReaddirResult>
  exists(path: string): Promise<FsExistsResult>
  unlink(path: string): Promise<FsResult>
  chmod(path: string, mode: number): Promise<FsResult>
  stat(path: string): Promise<FsStatResult>
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
  fs: GittonFs
  context: GittonContext
}

declare global {
  interface Window {
    gitton: GittonAPI
  }
}
