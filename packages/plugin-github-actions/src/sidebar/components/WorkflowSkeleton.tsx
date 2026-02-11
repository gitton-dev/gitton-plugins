import { Skeleton } from '@/components/ui/skeleton'

export function WorkflowSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4">
        <Skeleton className="w-4 h-4 rounded" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="w-8 h-8 rounded" />
      </div>
      {/* Branch select area */}
      <div className="px-4 pb-4 flex items-center gap-2 border-t pt-3 bg-accent/20">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

export function WorkflowListSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="w-8 h-8 rounded" />
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        <WorkflowSkeleton />
        <WorkflowSkeleton />
        <WorkflowSkeleton />
      </div>
    </div>
  )
}
