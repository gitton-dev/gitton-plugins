import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkflowItem, Workflow } from './WorkflowItem'
import { WorkflowListSkeleton } from './WorkflowSkeleton'

interface RepoInfo {
  owner: string
  name: string
}

export function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)

  async function getRepoInfo(): Promise<RepoInfo | null> {
    try {
      const result = await window.gitton.gh.run([
        'repo',
        'view',
        '--json',
        'owner,name'
      ])
      if (result.success) {
        const data = JSON.parse(result.stdout)
        return { owner: data.owner.login, name: data.name }
      }
    } catch (error) {
      console.error('Failed to get repo info:', error)
    }
    return null
  }

  async function loadWorkflows() {
    setLoading(true)
    setError(null)

    try {
      const info = await getRepoInfo()
      if (!info) {
        setError('Could not determine repository. Please open a GitHub repository.')
        setLoading(false)
        return
      }
      setRepoInfo(info)

      // Fetch workflows
      const workflowsResult = await window.gitton.gh.run([
        'api',
        `/repos/${info.owner}/${info.name}/actions/workflows`,
        '--jq',
        '.workflows | map({id, name, path, state, html_url})'
      ])

      if (!workflowsResult.success) {
        setError(workflowsResult.stderr || 'Failed to fetch workflows')
        setLoading(false)
        return
      }

      const workflowsData: Omit<Workflow, 'hasDispatch'>[] = JSON.parse(workflowsResult.stdout)

      // Check for workflow_dispatch trigger in each workflow
      const workflowsWithDispatch = await Promise.all(
        workflowsData.map(async (wf) => {
          try {
            const contentResult = await window.gitton.gh.run([
              'api',
              `/repos/${info.owner}/${info.name}/contents/${wf.path}`,
              '--jq',
              '.content'
            ])
            if (contentResult.success) {
              const content = atob(contentResult.stdout.trim())
              const hasDispatch = content.includes('workflow_dispatch')
              return { ...wf, hasDispatch }
            }
          } catch (e) {
            console.error(`Failed to check dispatch for ${wf.name}:`, e)
          }
          return { ...wf, hasDispatch: false }
        })
      )

      setWorkflows(workflowsWithDispatch)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflows()
  }, [])

  if (loading) {
    return <WorkflowListSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-center text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={loadWorkflows}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
          {repoInfo && (
            <span className="text-sm font-medium">
              {repoInfo.owner}/{repoInfo.name}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={loadWorkflows} title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {workflows.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No workflows found in this repository.
          </div>
        ) : (
          workflows.map((workflow) => (
            <WorkflowItem
              key={workflow.id}
              workflow={workflow}
              repoOwner={repoInfo!.owner}
              repoName={repoInfo!.name}
            />
          ))
        )}
      </div>
    </div>
  )
}
