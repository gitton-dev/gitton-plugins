import { useState, useEffect } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  Circle,
  Play,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronRight,
  GitBranch
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'

export interface Workflow {
  id: number
  name: string
  path: string
  state: string
  html_url: string
  hasDispatch: boolean
}

export interface WorkflowRun {
  id: number
  name: string
  status: string
  conclusion: string | null
  run_number: number
  created_at: string
  html_url: string
  head_branch: string
}

interface WorkflowItemProps {
  workflow: Workflow
  repoOwner: string
  repoName: string
}

function getWorkflowActionsUrl(repoOwner: string, repoName: string, workflowPath: string): string {
  // Convert .github/workflows/deploy.yaml to deploy.yaml
  const fileName = workflowPath.split('/').pop() || workflowPath
  return `https://github.com/${repoOwner}/${repoName}/actions/workflows/${fileName}`
}

function getStatusIcon(status: string, conclusion: string | null) {
  if (status === 'in_progress' || status === 'queued' || status === 'pending') {
    return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
  }
  if (conclusion === 'success') {
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }
  if (conclusion === 'failure') {
    return <XCircle className="w-4 h-4 text-red-500" />
  }
  if (conclusion === 'cancelled') {
    return <Circle className="w-4 h-4 text-gray-400" />
  }
  return <Clock className="w-4 h-4 text-muted-foreground" />
}

function getStatusVariant(
  status: string,
  conclusion: string | null
): 'success' | 'error' | 'warning' | 'muted' {
  if (status === 'in_progress' || status === 'queued' || status === 'pending') {
    return 'warning'
  }
  if (conclusion === 'success') {
    return 'success'
  }
  if (conclusion === 'failure') {
    return 'error'
  }
  return 'muted'
}

export function WorkflowItem({ workflow, repoOwner, repoName }: WorkflowItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [isLoadingRuns, setIsLoadingRuns] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)

  const latestRun = runs[0]

  // Load branches automatically if workflow has dispatch
  useEffect(() => {
    if (workflow.hasDispatch && branches.length === 0) {
      loadBranches()
    }
  }, [workflow.hasDispatch])

  async function loadRuns() {
    if (runs.length > 0) return
    setIsLoadingRuns(true)
    try {
      const result = await window.gitton.gh.run([
        'api',
        `/repos/${repoOwner}/${repoName}/actions/workflows/${workflow.id}/runs`,
        '--jq',
        '.workflow_runs[:5] | map({id, name, status, conclusion, run_number, created_at, html_url, head_branch})'
      ])
      if (result.success) {
        setRuns(JSON.parse(result.stdout))
      }
    } catch (error) {
      console.error('Failed to load runs:', error)
    } finally {
      setIsLoadingRuns(false)
    }
  }

  async function loadBranches() {
    if (branches.length > 0) return
    setIsLoadingBranches(true)
    try {
      const result = await window.gitton.gh.run([
        'api',
        `/repos/${repoOwner}/${repoName}/branches`,
        '--jq',
        '.[].name'
      ])
      if (result.success) {
        const branchList = result.stdout.trim().split('\n').filter(Boolean)
        setBranches(branchList)
        if (branchList.includes('main')) {
          setSelectedBranch('main')
        } else if (branchList.includes('master')) {
          setSelectedBranch('master')
        } else if (branchList.length > 0) {
          setSelectedBranch(branchList[0])
        }
      }
    } catch (error) {
      console.error('Failed to load branches:', error)
    } finally {
      setIsLoadingBranches(false)
    }
  }

  async function handleToggleExpand() {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    if (newExpanded) {
      await loadRuns()
    }
  }

  async function triggerWorkflow() {
    if (!selectedBranch) return
    setIsTriggering(true)
    try {
      const result = await window.gitton.gh.run([
        'workflow',
        'run',
        workflow.path,
        '--ref',
        selectedBranch,
        '-R',
        `${repoOwner}/${repoName}`
      ])
      if (result.success) {
        window.gitton.ui.showNotification(`Workflow "${workflow.name}" triggered on ${selectedBranch}`)
        // Reload runs after a short delay
        setTimeout(async () => {
          setRuns([])
          await loadRuns()
        }, 2000)
      } else {
        window.gitton.ui.showNotification(
          `Failed to trigger: ${result.stderr || result.error}`,
          'error'
        )
      }
    } catch (error) {
      window.gitton.ui.showNotification(`Error: ${error}`, 'error')
    } finally {
      setIsTriggering(false)
    }
  }

  function openExternal(url: string) {
    window.gitton.ui.openExternal(url)
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Workflow Header */}
      <div
        className="flex items-center gap-2 p-4 hover:bg-accent/50 cursor-pointer"
        onClick={handleToggleExpand}
      >
        <button className="p-0.5 hover:bg-accent rounded">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{workflow.name}</span>
            {latestRun && (
              <Badge variant={getStatusVariant(latestRun.status, latestRun.conclusion)}>
                {latestRun.conclusion || latestRun.status}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{workflow.path}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            openExternal(getWorkflowActionsUrl(repoOwner, repoName, workflow.path))
          }}
          title="Open in GitHub"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Branch Select and Run Button - Always visible for dispatch workflows */}
      {workflow.hasDispatch && (
        <div className="px-4 pb-4 flex items-center gap-2 border-t pt-3 bg-accent/20">
          <GitBranch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {isLoadingBranches ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="flex-1"
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  triggerWorkflow()
                }}
                disabled={isTriggering || !selectedBranch}
              >
                {isTriggering ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                Run
              </Button>
            </>
          )}
        </div>
      )}

      {/* Expanded Run History */}
      {isExpanded && (
        <div className="border-t">
          {isLoadingRuns ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">No runs yet</div>
          ) : (
            <div className="divide-y">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 cursor-pointer"
                  onClick={() => openExternal(run.html_url)}
                >
                  {getStatusIcon(run.status, run.conclusion)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{run.run_number}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {run.head_branch}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(run.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
