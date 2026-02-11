import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HookItem, GitHook } from './HookItem'

// Common Git hooks with descriptions
const HOOKS = [
  {
    name: 'pre-commit',
    description: 'Runs before a commit is created. Use for linting, testing, or validation.'
  },
  {
    name: 'prepare-commit-msg',
    description: 'Runs before the commit message editor opens. Use to modify the default commit message.'
  },
  {
    name: 'commit-msg',
    description: 'Runs after commit message is entered. Use to validate or format commit messages.'
  },
  {
    name: 'post-commit',
    description: 'Runs after a commit is created. Use for notifications or cleanup.'
  },
  {
    name: 'pre-push',
    description: 'Runs before pushing to remote. Use to run tests or validate the push.'
  },
  {
    name: 'pre-rebase',
    description: 'Runs before a rebase starts. Use to prevent rebasing certain branches.'
  },
  {
    name: 'post-checkout',
    description: 'Runs after checking out a branch. Use to setup environment or dependencies.'
  },
  {
    name: 'post-merge',
    description: 'Runs after a merge completes. Use to restore data or run post-merge tasks.'
  }
]

function HookSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-4 h-4" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full ml-2" />
        <div className="flex-1" />
        <Skeleton className="w-8 h-8" />
        <Skeleton className="w-8 h-8" />
      </div>
    </div>
  )
}

export function HookList() {
  const [hooks, setHooks] = useState<GitHook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadHooks() {
    setLoading(true)
    setError(null)

    try {
      const repoPath = window.gitton.context.repoPath
      if (!repoPath) {
        setError('No repository context available')
        setLoading(false)
        return
      }

      const hooksDir = '.git/hooks'

      // Check if hooks directory exists
      const dirExists = await window.gitton.fs.exists(hooksDir)
      if (!dirExists.exists) {
        setError('Git hooks directory not found. Is this a git repository?')
        setLoading(false)
        return
      }

      // Load all hooks
      const loadedHooks: GitHook[] = []

      for (const hookInfo of HOOKS) {
        const hookPath = `${hooksDir}/${hookInfo.name}`
        const disabledPath = `${hookPath}.disabled`

        // Check if hook exists (either enabled or disabled)
        const [enabledExists, disabledExists] = await Promise.all([
          window.gitton.fs.exists(hookPath),
          window.gitton.fs.exists(disabledPath)
        ])

        const exists = enabledExists.exists || disabledExists.exists
        const enabled = enabledExists.exists

        let content: string | undefined
        if (exists) {
          const actualPath = enabled ? hookPath : disabledPath
          const result = await window.gitton.fs.readFile(actualPath)
          if (result.success) {
            content = result.content
          }
        }

        loadedHooks.push({
          name: hookInfo.name,
          description: hookInfo.description,
          exists,
          enabled,
          content
        })
      }

      setHooks(loadedHooks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hooks')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(name: string, enabled: boolean) {
    const hooksDir = '.git/hooks'
    const hookPath = `${hooksDir}/${name}`
    const disabledPath = `${hookPath}.disabled`

    try {
      if (enabled) {
        // Rename from .disabled to enabled
        const content = await window.gitton.fs.readFile(disabledPath)
        if (content.success && content.content) {
          await window.gitton.fs.writeFile(hookPath, content.content)
          await window.gitton.fs.chmod(hookPath, 0o755)
          await window.gitton.fs.unlink(disabledPath)
        }
      } else {
        // Rename to .disabled
        const content = await window.gitton.fs.readFile(hookPath)
        if (content.success && content.content) {
          await window.gitton.fs.writeFile(disabledPath, content.content)
          await window.gitton.fs.unlink(hookPath)
        }
      }

      window.gitton.ui.showNotification(`Hook "${name}" ${enabled ? 'enabled' : 'disabled'}`)
      await loadHooks()
    } catch (err) {
      window.gitton.ui.showNotification(`Failed to toggle hook: ${err}`, 'error')
    }
  }

  async function handleDelete(name: string) {
    const hooksDir = '.git/hooks'
    const hookPath = `${hooksDir}/${name}`
    const disabledPath = `${hookPath}.disabled`

    try {
      // Try to delete both enabled and disabled versions
      const [enabledExists, disabledExists] = await Promise.all([
        window.gitton.fs.exists(hookPath),
        window.gitton.fs.exists(disabledPath)
      ])

      if (enabledExists.exists) {
        await window.gitton.fs.unlink(hookPath)
      }
      if (disabledExists.exists) {
        await window.gitton.fs.unlink(disabledPath)
      }

      window.gitton.ui.showNotification(`Hook "${name}" deleted`)
      await loadHooks()
    } catch (err) {
      window.gitton.ui.showNotification(`Failed to delete hook: ${err}`, 'error')
    }
  }

  async function handleSave(name: string, content: string) {
    const hooksDir = '.git/hooks'
    const hookPath = `${hooksDir}/${name}`

    try {
      await window.gitton.fs.writeFile(hookPath, content)
      await window.gitton.fs.chmod(hookPath, 0o755) // Make executable

      window.gitton.ui.showNotification(`Hook "${name}" saved`)
      await loadHooks()
    } catch (err) {
      window.gitton.ui.showNotification(`Failed to save hook: ${err}`, 'error')
    }
  }

  useEffect(() => {
    loadHooks()
  }, [])

  // Listen for context changes
  useEffect(() => {
    const handleContextChange = () => {
      loadHooks()
    }
    window.addEventListener('gitton:contextchange', handleContextChange)
    return () => window.removeEventListener('gitton:contextchange', handleContextChange)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="w-8 h-8 rounded" />
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <HookSkeleton />
          <HookSkeleton />
          <HookSkeleton />
          <HookSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-center text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={loadHooks}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const activeHooks = hooks.filter((h) => h.exists && h.enabled).length
  const totalHooks = hooks.filter((h) => h.exists).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Git Hooks ({activeHooks}/{totalHooks} active)
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={loadHooks} title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Hook List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {hooks.map((hook) => (
          <HookItem
            key={hook.name}
            hook={hook}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}
