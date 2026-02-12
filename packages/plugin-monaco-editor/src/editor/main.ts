import * as monaco from 'monaco-editor'

// Monaco Editor worker paths will be handled by Vite
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Configure Monaco Environment for workers
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

// Disable TypeScript/JavaScript diagnostics (no squiggly lines)
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true
})
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true
})

// Language detection from file extension
function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    'json': 'json',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'md': 'markdown',
    'mdx': 'markdown',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'svg': 'xml',
    'py': 'python',
    'rb': 'ruby',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'kt': 'kotlin',
    'swift': 'swift',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'sql': 'sql',
    'graphql': 'graphql',
    'gql': 'graphql',
    'dockerfile': 'dockerfile',
    'toml': 'ini',
    'ini': 'ini',
    'env': 'ini',
    'gitignore': 'ini',
  }
  return languageMap[ext] || 'plaintext'
}

// Editor instance
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let currentFilename = ''

// Apply theme helper
function applyTheme(theme: string) {
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs'
  monaco.editor.setTheme(monacoTheme)
}

// Initialize editor
function initEditor(container: HTMLElement) {
  editor = monaco.editor.create(container, {
    value: '',
    language: 'plaintext',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: {
      enabled: true
    },
    scrollBeyondLastLine: false,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    tabSize: 2,
    wordWrap: 'off',
    formatOnPaste: true,
    formatOnType: true,
    cursorBlinking: 'smooth',
    smoothScrolling: true,
    padding: {
      top: 8,
      bottom: 8
    }
  })

  // Listen for content changes
  editor.onDidChangeModelContent(() => {
    if (editor) {
      const content = editor.getValue()
      window.gitton.postMessage.send({
        type: 'contentChanged',
        content,
        filename: currentFilename
      })
    }
  })

  // Add Cmd+S / Ctrl+S to save
  editor.addAction({
    id: 'save-file',
    label: 'Save File',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: async () => {
      if (!currentFilename || typeof window.gitton === 'undefined') return
      try {
        const content = editor.getValue()
        await window.gitton.fs.writeFile(currentFilename, content)
        window.gitton.ui.showNotification(`Saved: ${currentFilename}`, 'info')
        // Notify parent that file was saved
        window.gitton.postMessage.send({
          type: 'saved',
          content,
          filename: currentFilename
        })
      } catch (e) {
        console.error('[Monaco] Failed to save:', e)
        window.gitton.ui.showNotification(`Failed to save: ${e}`, 'error')
      }
    }
  })

  return editor
}

// Set editor content
function setContent(content: string, filename: string) {
  if (!editor) return

  const language = detectLanguage(filename)
  const uri = monaco.Uri.parse(`file:///${filename}`)

  // Check if we're updating the same file
  const currentModel = editor.getModel()
  if (currentModel && currentFilename === filename) {
    // Same file - only update if content actually changed
    // Preserve cursor position and selection
    if (currentModel.getValue() !== content) {
      const position = editor.getPosition()
      const selections = editor.getSelections()
      currentModel.setValue(content)
      if (position) editor.setPosition(position)
      if (selections) editor.setSelections(selections)
    }
    return
  }

  currentFilename = filename

  // Different file - create or get model
  let model = monaco.editor.getModel(uri)
  if (model) {
    // Model exists, update content if different
    if (model.getValue() !== content) {
      model.setValue(content)
    }
  } else {
    // Create new model
    model = monaco.editor.createModel(content, language, uri)
  }

  editor.setModel(model)
}

// Get editor content
function getContent(): string {
  return editor?.getValue() || ''
}

// Listen for messages from parent
window.addEventListener('message', (event) => {
  const { type, content, filename, theme, options } = event.data || {}

  switch (type) {
    case 'render':
    case 'setContent':
      setContent(content || '', filename || options?.filename || '')
      break

    case 'getContent':
      window.gitton.postMessage.send({
        type: 'content',
        content: getContent(),
        filename: currentFilename
      })
      break

    case 'theme':
      applyTheme(theme)
      break

    case 'focus':
      editor?.focus()
      break

    case 'setReadOnly':
      editor?.updateOptions({ readOnly: !!options?.readOnly })
      break
  }
})

// Listen for Gitton context changes
window.addEventListener('gitton:contextchange', (event) => {
  const detail = (event as CustomEvent).detail
  if (detail?.theme) {
    applyTheme(detail.theme)
  }
})

// Apply initial theme from Gitton context
if (typeof window.gitton !== 'undefined' && window.gitton?.context?.theme) {
  applyTheme(window.gitton.context.theme)
}

// Initialize
const container = document.getElementById('editor')!
initEditor(container)

// Signal ready
window.gitton.postMessage.send({ type: 'ready' })
