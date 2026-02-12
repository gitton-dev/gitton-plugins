import { render } from '../renderer'

// Load zenn-content-css from CDN
const zennCssLink = document.createElement('link')
zennCssLink.rel = 'stylesheet'
zennCssLink.href = 'https://unpkg.com/zenn-content-css@0.4.5/lib/index.css'
document.head.appendChild(zennCssLink)

// Custom styles
const style = document.createElement('style')
style.textContent = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: transparent;
  }
  .znc { max-width: 100%; }
`
document.head.appendChild(style)

// Content container
const root = document.getElementById('root')!
root.className = 'znc'

// Apply theme helper - uses zenn-content-css data-theme attribute
function applyTheme(theme: string) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark-blue')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// Listen for content from parent
window.addEventListener('message', async (event) => {
  if (event.data.type === 'render') {
    try {
      const html = await render(event.data.content, event.data.options || {})
      root.innerHTML = html

      // Send height back to parent for auto-resize
      const height = document.body.scrollHeight
      window.parent.postMessage({ type: 'resize', height }, '*')
    } catch (error) {
      console.error('Render error:', error)
      root.innerHTML = '<pre style="color:red;">' + (error as Error).message + '</pre>'
    }
  } else if (event.data.type === 'theme') {
    applyTheme(event.data.theme)
  }
})

// Listen for Gitton context changes (from SDK)
window.addEventListener('gitton:contextchange', (event) => {
  const detail = (event as CustomEvent).detail
  if (detail?.theme) {
    applyTheme(detail.theme)
  }
})

// Apply initial theme from Gitton context (if available)
declare const gitton: { context?: { theme?: string } } | undefined
if (typeof gitton !== 'undefined' && gitton?.context?.theme) {
  applyTheme(gitton.context.theme)
}

// Signal ready
window.parent.postMessage({ type: 'ready' }, '*')

// Load Zenn embed script
const script = document.createElement('script')
script.src = 'https://embed.zenn.studio/js/listen-embed-event.js'
document.body.appendChild(script)
