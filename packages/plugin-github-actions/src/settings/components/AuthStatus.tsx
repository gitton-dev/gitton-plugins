import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RefreshCw, ExternalLink, User, Key, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

interface AuthInfo {
  authenticated: boolean
  username?: string
  scopes?: string[]
  protocol?: string
}

export function AuthStatus() {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function checkAuth() {
    setLoading(true)
    setError(null)

    try {
      const result = await window.gitton.gh.run(['auth', 'status'])

      // gh auth status outputs to stderr, combine both
      const output = (result.stdout || '') + (result.stderr || '')

      // Debug: log the output
      console.log('gh auth status output:', output)

      // Check for various indicators of being logged in
      // Format can vary: "Logged in to github.com as username" or "✓ Logged in to github.com account username"
      const loggedInMatch = output.match(/Logged in to (\S+)(?: account)? (?:as )?(\S+)/) ||
                           output.match(/✓.*Logged in.*as (\S+)/i)

      // Also check if output contains positive indicators
      const isLoggedIn = output.includes('Logged in') ||
                        output.includes('✓') ||
                        (output.includes('github.com') && !output.includes('not logged'))

      const scopesMatch = output.match(/Token scopes[:\s]+['"]?([^'"\n]+)['"]?/)
      const protocolMatch = output.match(/Git operations protocol[:\s]+(\S+)/)

      // Try to extract username from various formats
      let username: string | undefined
      if (loggedInMatch) {
        username = loggedInMatch[2] || loggedInMatch[1]
      } else {
        const usernameMatch = output.match(/account\s+(\S+)/) || output.match(/as\s+(\S+)/)
        username = usernameMatch?.[1]
      }

      if (isLoggedIn) {
        setAuthInfo({
          authenticated: true,
          username: username?.replace(/[()]/g, ''),
          scopes: scopesMatch ? scopesMatch[1].split(/[,\s]+/).map((s) => s.trim()).filter(Boolean) : [],
          protocol: protocolMatch ? protocolMatch[1] : 'https'
        })
      } else {
        setAuthInfo({ authenticated: false })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check authentication')
      setAuthInfo({ authenticated: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            GitHub Authentication
          </CardTitle>
          <CardDescription>
            This plugin uses the GitHub CLI (gh) for authentication. Make sure you're logged in
            with the gh CLI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {authInfo && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {authInfo.authenticated ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400">Authenticated</p>
                      <p className="text-sm text-muted-foreground">
                        GitHub CLI is properly configured
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Not Authenticated</p>
                      <p className="text-sm text-muted-foreground">
                        Please run{' '}
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">gh auth login</code>{' '}
                        in your terminal
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* User Info */}
              {authInfo.authenticated && authInfo.username && (
                <div className="grid gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Username:</span>
                    <span className="text-sm font-medium">{authInfo.username}</span>
                  </div>

                  {authInfo.protocol && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Protocol:</span>
                      <span className="text-sm font-medium">{authInfo.protocol}</span>
                    </div>
                  )}

                  {authInfo.scopes && authInfo.scopes.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Key className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm text-muted-foreground">Scopes:</span>
                      <div className="flex flex-wrap gap-1">
                        {authInfo.scopes.map((scope) => (
                          <Badge key={scope} variant="secondary" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={checkAuth}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://cli.github.com/manual/gh_auth_login', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            To use this plugin, you need to authenticate with the GitHub CLI:
          </p>
          <div className="bg-muted rounded-lg p-3 font-mono text-sm">
            <p className="text-muted-foreground"># Install GitHub CLI (if not installed)</p>
            <p>brew install gh</p>
            <br />
            <p className="text-muted-foreground"># Login to GitHub</p>
            <p>gh auth login</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Make sure to grant the <code className="bg-muted px-1 py-0.5 rounded">workflow</code>{' '}
            scope when authenticating to be able to trigger workflows.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
