import { render, init } from '../renderer'

// Track CSS load state and content render state
let cssLoaded = false
let hasContent = false

// Load zenn-content-css from CDN
const zennCssLink = document.createElement('link')
zennCssLink.rel = 'stylesheet'
zennCssLink.href = 'https://unpkg.com/zenn-content-css@0.4.5/lib/index.css'
zennCssLink.onload = () => {
  cssLoaded = true
  // Only send resize if content has been rendered
  if (hasContent) {
    sendResize()
  }
}
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

// Send height to parent
let lastHeight = 0
let resizeTimeout: number | null = null

function sendResize() {
  // Only send resize when both CSS is loaded and content exists
  if (!cssLoaded || !hasContent) return

  // Cancel pending resize
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }

  // Wait for layout to stabilize
  resizeTimeout = window.setTimeout(() => {
    requestAnimationFrame(() => {
      const height = document.body.scrollHeight
      // Only send if height changed
      if (height !== lastHeight && height > 0) {
        lastHeight = height
        window.gitton.postMessage.send({
          type: 'gitton:custom',
          pluginId: window.gitton.pluginId,
          messageType: 'resize',
          payload: { height }
        })
      }
    })
  }, 50)
}

// Watch for height changes with ResizeObserver
const resizeObserver = new ResizeObserver(() => {
  sendResize()
})
resizeObserver.observe(root)

// Apply theme helper - uses zenn-content-css data-theme attribute
function applyTheme(theme: string) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark-blue')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// Listen for messages from parent (using PluginFrame protocol)
window.addEventListener('message', async (event) => {
  // Handle gitton:context (sent by PluginFrame for theme/repoPath)
  if (event.data.type === 'gitton:context') {
    if (event.data.context?.theme) {
      applyTheme(event.data.context.theme)
    }
    return
  }

  // Handle gitton:custom messages (render content, etc.)
  if (event.data.type === 'gitton:custom') {
    const { messageType, payload } = event.data

    if (messageType === 'render') {
      try {
        const html = await render(payload.content as string, payload.options || {})
        root.innerHTML = html
        hasContent = true

        // Send resize after render
        sendResize()
      } catch (error) {
        console.error('Render error:', error)
        root.innerHTML = '<pre style="color:red;">' + (error as Error).message + '</pre>'
        hasContent = true
      }
    }
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
if (typeof window.gitton !== 'undefined' && window.gitton?.context?.theme) {
  applyTheme(window.gitton.context.theme)
}

// Load Zenn embed script
const script = document.createElement('script')
script.src = 'https://embed.zenn.studio/js/listen-embed-event.js'
document.body.appendChild(script)

// Initialize link click handlers
init()
