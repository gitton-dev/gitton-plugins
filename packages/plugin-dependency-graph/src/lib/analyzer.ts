export interface FileNode {
  id: string
  path: string
  name: string
  dependencies: string[]
  dependents: string[]
}

export interface DependencyGraph {
  nodes: Map<string, FileNode>
  edges: Array<{ source: string; target: string }>
}

// Patterns for detecting imports
const importPatterns = [
  // ES6 imports: import x from './path', import { x } from './path'
  /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
  // Dynamic imports: import('./path')
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // CommonJS require: require('./path')
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // TypeScript type imports: import type { x } from './path'
  /import\s+type\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
]

// File extensions to analyze
const ANALYZABLE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.vue', '.svelte'
]

// Extensions to try when resolving imports
const RESOLVE_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']

export function shouldAnalyzeFile(path: string): boolean {
  return ANALYZABLE_EXTENSIONS.some(ext => path.endsWith(ext))
}

export function extractImports(content: string): string[] {
  const imports: Set<string> = new Set()

  for (const pattern of importPatterns) {
    // Reset regex lastIndex
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(content)) !== null) {
      const importPath = match[1]
      // Only include relative imports and alias imports
      if (importPath.startsWith('.') || importPath.startsWith('@/') || importPath.startsWith('~/')) {
        imports.add(importPath)
      }
    }
  }

  return Array.from(imports)
}

export function resolveImportPath(fromFile: string, importPath: string): string {
  // Handle alias imports (@/ or ~/)
  if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
    return importPath.replace(/^[@~]\//, 'src/')
  }

  // Get directory of the importing file
  const fromDir = fromFile.split('/').slice(0, -1).join('/')

  // Resolve relative path
  const parts = importPath.split('/')
  const resultParts = fromDir ? fromDir.split('/') : []

  for (const part of parts) {
    if (part === '..') {
      resultParts.pop()
    } else if (part !== '.') {
      resultParts.push(part)
    }
  }

  return resultParts.join('/')
}

export function getFileName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1]
}

export async function analyzeRepository(
  readFile: (path: string) => Promise<{ success: boolean; content?: string }>,
  readdir: (path: string) => Promise<{ success: boolean; entries?: Array<{ name: string; isDirectory: boolean }> }>,
  rootPath: string = '',
  includePatterns: string[] = ['src'],
  excludePatterns: string[] = ['node_modules', 'dist', 'build', '.git']
): Promise<DependencyGraph> {
  const nodes = new Map<string, FileNode>()
  const filePaths: string[] = []

  // Recursively collect all files
  async function collectFiles(dirPath: string) {
    const result = await readdir(dirPath)
    if (!result.success || !result.entries) return

    for (const entry of result.entries) {
      const fullPath = dirPath ? `${dirPath}/${entry.name}` : entry.name

      // Check exclude patterns
      if (excludePatterns.some(p => fullPath.includes(p))) continue

      if (entry.isDirectory) {
        await collectFiles(fullPath)
      } else if (shouldAnalyzeFile(entry.name)) {
        filePaths.push(fullPath)
      }
    }
  }

  // Start from include patterns or root
  if (includePatterns.length > 0) {
    for (const pattern of includePatterns) {
      await collectFiles(pattern)
    }
  } else {
    await collectFiles(rootPath)
  }

  // Analyze each file
  for (const filePath of filePaths) {
    const result = await readFile(filePath)
    if (!result.success || !result.content) continue

    const imports = extractImports(result.content)
    const resolvedImports = imports.map(imp => resolveImportPath(filePath, imp))

    nodes.set(filePath, {
      id: filePath,
      path: filePath,
      name: getFileName(filePath),
      dependencies: resolvedImports,
      dependents: []
    })
  }

  // Build edges and populate dependents
  const edges: Array<{ source: string; target: string }> = []

  for (const [filePath, node] of nodes) {
    for (const dep of node.dependencies) {
      // Try to find the actual file
      let targetPath: string | null = null

      for (const ext of RESOLVE_EXTENSIONS) {
        const candidate = dep + ext
        if (nodes.has(candidate)) {
          targetPath = candidate
          break
        }
      }

      if (targetPath) {
        edges.push({ source: filePath, target: targetPath })
        const targetNode = nodes.get(targetPath)
        if (targetNode) {
          targetNode.dependents.push(filePath)
        }
      }
    }
  }

  return { nodes, edges }
}
