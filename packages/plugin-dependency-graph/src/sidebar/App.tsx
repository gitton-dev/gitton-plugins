import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  Position,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { analyzeRepository, DependencyGraph } from '../lib/analyzer'
import { RefreshCw, Search, Layers } from 'lucide-react'

// Dagre layout
import dagre from 'dagre'

interface LayoutOptions {
  direction: 'TB' | 'LR'
  nodeSpacing: number
  rankSpacing: number
}

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = { direction: 'LR', nodeSpacing: 50, rankSpacing: 150 }
) {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: options.direction, nodesep: options.nodeSpacing, ranksep: options.rankSpacing })

  const nodeWidth = 150
  const nodeHeight = 36

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const newNode = {
      ...node,
      targetPosition: options.direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: options.direction === 'LR' ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
    return newNode
  })

  return { nodes: newNodes, edges }
}

function graphToFlowElements(graph: DependencyGraph, selectedFile: string | null): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  for (const [id, fileNode] of graph.nodes) {
    const isSelected = selectedFile === id
    const isConnected = selectedFile
      ? fileNode.dependencies.some(d => graph.nodes.has(d) && d === selectedFile) ||
        fileNode.dependents.includes(selectedFile)
      : false

    nodes.push({
      id,
      data: {
        label: fileNode.name,
        fullPath: fileNode.path,
        dependencies: fileNode.dependencies.length,
        dependents: fileNode.dependents.length,
      },
      position: { x: 0, y: 0 },
      style: {
        opacity: selectedFile && !isSelected && !isConnected ? 0.3 : 1,
      },
    })
  }

  for (const edge of graph.edges) {
    const isConnected = selectedFile
      ? edge.source === selectedFile || edge.target === selectedFile
      : true

    edges.push({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15 },
      style: {
        opacity: selectedFile && !isConnected ? 0.2 : 1,
        strokeWidth: isConnected && selectedFile ? 2 : 1.5,
      },
      animated: isConnected && !!selectedFile,
    })
  }

  return getLayoutedElements(nodes, edges)
}

export default function App() {
  const [graph, setGraph] = useState<DependencyGraph | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')

  const analyze = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSelectedNode(null)

    try {
      const result = await analyzeRepository(
        async (path) => gitton.fs.readFile(path),
        async (path) => gitton.fs.readdir(path),
        '',
        ['src'],
        ['node_modules', 'dist', 'build', '.git', '__tests__', '*.test.*', '*.spec.*']
      )

      setGraph(result)
      const { nodes: layoutedNodes, edges: layoutedEdges } = graphToFlowElements(result, null)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)

      if (result.nodes.size === 0) {
        setError('No analyzable files found in src/ directory')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze dependencies')
      gitton.ui.showNotification('Failed to analyze dependencies', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    analyze()
  }, [analyze])

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery || !graph) return nodes
    return nodes.filter(node =>
      node.data.fullPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [nodes, searchQuery, graph])

  const filteredEdges = useMemo(() => {
    if (!searchQuery) return edges
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  }, [edges, filteredNodes, searchQuery])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const newSelected = selectedNode === node.id ? null : node.id
    setSelectedNode(newSelected)

    if (graph) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = graphToFlowElements(graph, newSelected)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    }
  }, [selectedNode, graph, setNodes, setEdges])

  const onPaneClick = useCallback(() => {
    if (selectedNode && graph) {
      setSelectedNode(null)
      const { nodes: layoutedNodes, edges: layoutedEdges } = graphToFlowElements(graph, null)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    }
  }, [selectedNode, graph, setNodes, setEdges])

  const toggleDirection = useCallback(() => {
    const newDirection = direction === 'LR' ? 'TB' : 'LR'
    setDirection(newDirection)

    if (graph) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes.map(n => ({ ...n, position: { x: 0, y: 0 } })),
        edges,
        { direction: newDirection, nodeSpacing: 50, rankSpacing: 150 }
      )
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    }
  }, [direction, graph, nodes, edges, setNodes, setEdges])

  const stats = useMemo(() => {
    if (!graph) return null
    return {
      files: graph.nodes.size,
      connections: graph.edges.length,
    }
  }, [graph])

  const selectedInfo = useMemo(() => {
    if (!selectedNode || !graph) return null
    const node = graph.nodes.get(selectedNode)
    if (!node) return null
    return {
      path: node.path,
      dependencies: node.dependencies.filter(d => {
        for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']) {
          if (graph.nodes.has(d + ext)) return true
        }
        return false
      }).length,
      dependents: node.dependents.length,
    }
  }, [selectedNode, graph])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={toggleDirection}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          title={`Switch to ${direction === 'LR' ? 'vertical' : 'horizontal'} layout`}
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={analyze}
          disabled={isLoading}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground border-b border-border">
          <span>{stats.files} files</span>
          <span>{stats.connections} connections</span>
          {selectedInfo && (
            <>
              <span className="ml-auto">→ {selectedInfo.dependencies} deps</span>
              <span>← {selectedInfo.dependents} refs</span>
            </>
          )}
        </div>
      )}

      {/* Selected file info */}
      {selectedInfo && (
        <div className="px-3 py-2 text-xs bg-primary/10 border-b border-border">
          <div className="font-mono truncate" title={selectedInfo.path}>
            {selectedInfo.path}
          </div>
        </div>
      )}

      {/* Graph */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing dependencies...
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={analyze}
                className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!error && !isLoading && graph && graph.nodes.size > 0 && (
          <ReactFlow
            nodes={searchQuery ? filteredNodes : nodes}
            edges={searchQuery ? filteredEdges : edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Controls showInteractive={false} />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
