import { useState } from 'react'
import {
  FileCode,
  Play,
  Trash2,
  Edit,
  Power,
  PowerOff,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface GitHook {
  name: string
  description: string
  exists: boolean
  enabled: boolean
  content?: string
}

interface HookItemProps {
  hook: GitHook
  onToggle: (name: string, enabled: boolean) => Promise<void>
  onDelete: (name: string) => Promise<void>
  onSave: (name: string, content: string) => Promise<void>
}

export function HookItem({ hook, onToggle, onDelete, onSave }: HookItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(hook.content || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleToggle() {
    setIsLoading(true)
    try {
      await onToggle(hook.name, !hook.enabled)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete hook "${hook.name}"?`)) return
    setIsLoading(true)
    try {
      await onDelete(hook.name)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave(hook.name, editContent)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setEditContent(hook.content || '')
    setIsEditing(false)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 hover:bg-accent/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="p-0.5 hover:bg-accent rounded">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <FileCode className="w-4 h-4 text-muted-foreground" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{hook.name}</span>
            {hook.exists && (
              <Badge variant={hook.enabled ? 'success' : 'muted'}>
                {hook.enabled ? 'Active' : 'Disabled'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{hook.description}</p>
        </div>

        <div className="flex items-center gap-1">
          {hook.exists && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggle()
                }}
                disabled={isLoading}
                title={hook.enabled ? 'Disable hook' : 'Enable hook'}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : hook.enabled ? (
                  <Power className="w-4 h-4 text-green-500" />
                ) : (
                  <PowerOff className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(true)
                  setIsEditing(true)
                  setEditContent(hook.content || '')
                }}
                title="Edit hook"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                disabled={isLoading}
                title="Delete hook"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </>
          )}
          {!hook.exists && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
                setIsEditing(true)
                setEditContent(getDefaultHookContent(hook.name))
              }}
            >
              Create
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t bg-muted/30">
          {isEditing ? (
            <div className="p-4 space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-64 p-3 font-mono text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="#!/bin/sh\n\n# Your hook script here"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : hook.content ? (
            <pre className="p-4 text-sm font-mono overflow-auto max-h-64 whitespace-pre-wrap">
              {hook.content}
            </pre>
          ) : (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Hook not created yet
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getDefaultHookContent(hookName: string): string {
  const templates: Record<string, string> = {
    'pre-commit': `#!/bin/sh
# Pre-commit hook - runs before each commit

# Example: Run linter
# npm run lint

# Example: Run tests
# npm test

# Exit with non-zero to abort the commit
exit 0
`,
    'pre-push': `#!/bin/sh
# Pre-push hook - runs before pushing commits

# Example: Run tests before pushing
# npm test

# Exit with non-zero to abort the push
exit 0
`,
    'commit-msg': `#!/bin/sh
# Commit message hook - validates commit message

# The commit message file is passed as the first argument
COMMIT_MSG_FILE=$1

# Example: Check for conventional commit format
# if ! grep -qE "^(feat|fix|docs|style|refactor|test|chore):" "$COMMIT_MSG_FILE"; then
#   echo "Error: Commit message must follow conventional commit format"
#   exit 1
# fi

exit 0
`,
    'post-commit': `#!/bin/sh
# Post-commit hook - runs after a commit is created

# Example: Send notification
# echo "Commit created successfully!"

exit 0
`,
    'pre-rebase': `#!/bin/sh
# Pre-rebase hook - runs before rebasing

# Exit with non-zero to abort the rebase
exit 0
`,
    'post-merge': `#!/bin/sh
# Post-merge hook - runs after a successful merge

# Example: Install dependencies if package.json changed
# if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep -q "package.json"; then
#   npm install
# fi

exit 0
`,
    'post-checkout': `#!/bin/sh
# Post-checkout hook - runs after git checkout

# Arguments: previous HEAD, new HEAD, branch flag (1 if branch checkout)
# PREV_HEAD=$1
# NEW_HEAD=$2
# IS_BRANCH=$3

exit 0
`
  }

  return templates[hookName] || `#!/bin/sh
# ${hookName} hook

exit 0
`
}
