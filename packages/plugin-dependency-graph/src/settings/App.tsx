import { useEffect, useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'

interface Settings {
  includePaths: string
  excludePaths: string
  showExternalDeps: boolean
}

const defaultSettings: Settings = {
  includePaths: 'src',
  excludePaths: 'node_modules, dist, build, .git, __tests__',
  showExternalDeps: false,
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      const all = await gitton.settings.getAll() as Partial<Settings>
      setSettings({
        includePaths: (all.includePaths as string) || defaultSettings.includePaths,
        excludePaths: (all.excludePaths as string) || defaultSettings.excludePaths,
        showExternalDeps: (all.showExternalDeps as boolean) ?? defaultSettings.showExternalDeps,
      })
    }
    loadSettings()
  }, [])

  const handleChange = (key: keyof Settings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await gitton.settings.set('includePaths', settings.includePaths)
      await gitton.settings.set('excludePaths', settings.excludePaths)
      await gitton.settings.set('showExternalDeps', settings.showExternalDeps)
      gitton.ui.showNotification('Settings saved!', 'info')
      setHasChanges(false)
    } catch (error) {
      gitton.ui.showNotification('Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Dependency Graph Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure how the dependency analyzer scans your project.
        </p>
      </div>

      {/* Include Paths */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Include Paths
        </label>
        <input
          type="text"
          value={settings.includePaths}
          onChange={(e) => handleChange('includePaths', e.target.value)}
          placeholder="src, lib"
          className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of directories to analyze. Leave empty to scan entire project.
        </p>
      </div>

      {/* Exclude Paths */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Exclude Paths
        </label>
        <input
          type="text"
          value={settings.excludePaths}
          onChange={(e) => handleChange('excludePaths', e.target.value)}
          placeholder="node_modules, dist, build"
          className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of paths to exclude from analysis.
        </p>
      </div>

      {/* Show External Dependencies */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="showExternalDeps"
          checked={settings.showExternalDeps}
          onChange={(e) => handleChange('showExternalDeps', e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="showExternalDeps" className="text-sm">
          Show external dependencies (npm packages)
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
