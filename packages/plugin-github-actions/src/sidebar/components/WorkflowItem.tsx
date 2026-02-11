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
  GitBranch,
  Settings2
} from 'lucide-react'
import { parse as parseYaml } from 'yaml'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

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

interface WorkflowInput {
  name: string
  description?: string
  required?: boolean
  default?: string | boolean
  type?: 'string' | 'boolean' | 'choice' | 'environment'
  options?: string[]
}

interface WorkflowItemProps {
  workflow: Workflow
  repoOwner: string
  repoName: string
}

function getWorkflowActionsUrl(repoOwner: string, repoName: string, workflowPath: string): string {
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
  const [workflowInputs, setWorkflowInputs] = useState<WorkflowInput[]>([])
  const [inputValues, setInputValues] = useState<Record<string, string | boolean>>({})
  const [isLoadingInputs, setIsLoadingInputs] = useState(false)
  const [showInputs, setShowInputs] = useState(false)

  const latestRun = runs[0]

  // Load latest run on mount
  useEffect(() => {
    loadLatestRun()
  }, [])

  // Load branches and inputs automatically if workflow has dispatch
  useEffect(() => {
    if (workflow.hasDispatch) {
      if (branches.length === 0) {
        loadBranches()
      }
      loadWorkflowInputs()
    }
  }, [workflow.hasDispatch])

  async function loadLatestRun() {
    try {
      const result = await window.gitton.gh.run([
        'api',
        `/repos/${repoOwner}/${repoName}/actions/workflows/${workflow.id}/runs`,
        '--jq',
        '.workflow_runs[:1] | map({id, name, status, conclusion, run_number, created_at, html_url, head_branch})'
      ])
      if (result.success) {
        const latestRuns = JSON.parse(result.stdout)
        if (latestRuns.length > 0) {
          setRuns(latestRuns)
        }
      }
    } catch (error) {
      console.error('Failed to load latest run:', error)
    }
  }

  async function loadWorkflowInputs() {
    setIsLoadingInputs(true)
    try {
      // Fetch workflow file content from GitHub API
      const result = await window.gitton.gh.run([
        'api',
        `/repos/${repoOwner}/${repoName}/contents/${workflow.path}`,
        '--jq',
        '.content'
      ])

      if (result.success) {
        // Decode base64 content
        const content = atob(result.stdout.trim().replace(/\n/g, ''))
        const parsed = parseYaml(content)

        // Extract workflow_dispatch inputs
        const dispatchInputs = parsed?.on?.workflow_dispatch?.inputs
        if (dispatchInputs) {
          const inputs: WorkflowInput[] = Object.entries(dispatchInputs).map(
            ([name, config]: [string, any]) => ({
              name,
              description: config.description,
              required: config.required,
              default: config.default,
              type: config.type || 'string',
              options: config.options
            })
          )
          setWorkflowInputs(inputs)

          // Initialize default values
          const defaults: Record<string, string | boolean> = {}
          for (const input of inputs) {
            if (input.default !== undefined) {
              defaults[input.name] = input.default
            } else if (input.type === 'boolean') {
              defaults[input.name] = false
            } else if (input.type === 'choice' && input.options?.length) {
              defaults[input.name] = input.options[0]
            } else {
              defaults[input.name] = ''
            }
          }
          setInputValues(defaults)

          // Auto-show inputs if there are any
          if (inputs.length > 0) {
            setShowInputs(true)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load workflow inputs:', error)
    } finally {
      setIsLoadingInputs(false)
    }
  }

  async function loadRuns() {
    if (runs.length > 1) return // Already loaded full list
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

  function updateInputValue(name: string, value: string | boolean) {
    setInputValues((prev) => ({ ...prev, [name]: value }))
  }

  async function triggerWorkflow() {
    if (!selectedBranch) return
    setIsTriggering(true)
    try {
      // Build the gh workflow run command with inputs
      const args = ['workflow', 'run', workflow.path, '--ref', selectedBranch, '-R', `${repoOwner}/${repoName}`]

      // Add inputs as -f flags
      for (const input of workflowInputs) {
        const value = inputValues[input.name]
        if (value !== undefined && value !== '') {
          args.push('-f', `${input.name}=${value}`)
        }
      }

      const result = await window.gitton.gh.run(args)
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

  function renderInput(input: WorkflowInput) {
    const value = inputValues[input.name]

    switch (input.type) {
      case 'boolean':
        return (
          <Checkbox
            id={`input-${input.name}`}
            checked={value === true || value === 'true'}
            onChange={(e) => updateInputValue(input.name, e.target.checked)}
            label={input.description || input.name}
          />
        )

      case 'choice':
        return (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{input.description || input.name}</label>
            <Select value={String(value)} onValueChange={(v) => updateInputValue(input.name, v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {input.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      default:
        return (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{input.description || input.name}</label>
            <Input
              type="text"
              value={String(value)}
              onChange={(e) => updateInputValue(input.name, e.target.value)}
              placeholder={input.default ? String(input.default) : input.name}
            />
          </div>
        )
    }
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

      {/* Branch Select, Inputs, and Run Button */}
      {workflow.hasDispatch && (
        <div className="px-4 pb-4 border-t pt-3 bg-accent/20 space-y-3">
          {/* Branch selector */}
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {isLoadingBranches ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {workflowInputs.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInputs(!showInputs)}
                title={showInputs ? 'Hide inputs' : 'Show inputs'}
              >
                <Settings2 className={`w-4 h-4 ${showInputs ? 'text-primary' : ''}`} />
              </Button>
            )}
          </div>

          {/* Workflow inputs */}
          {showInputs && workflowInputs.length > 0 && (
            <div className="space-y-3 pl-6">
              {isLoadingInputs ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                workflowInputs.map((input) => (
                  <div key={input.name}>{renderInput(input)}</div>
                ))
              )}
            </div>
          )}

          {/* Run button */}
          <div className="flex justify-end">
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
              Run workflow
            </Button>
          </div>
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
