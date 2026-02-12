import { render } from '../renderer'

// Load zenn-content-css from CDN
const zennCssLink = document.createElement('link')
zennCssLink.rel = 'stylesheet'
zennCssLink.href = 'https://unpkg.com/zenn-content-css@0.1.160/lib/index.css'
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
  .dark body {
    color: #e5e5e5;
    background: transparent;
  }
  .znc { max-width: 100%; }
  /* Adjust Zenn styles for dark mode */
  .dark .znc { color: #e5e5e5; }
  .dark .znc a { color: #60a5fa; }
  .dark .znc code { background: #374151; }
  .dark .znc pre { background: #1f2937; }
  .dark .znc blockquote { border-color: #4b5563; color: #9ca3af; }
  .dark .znc table th { background: #374151; }
  .dark .znc table td, .dark .znc table th { border-color: #4b5563; }
  .dark .znc hr { border-color: #4b5563; }
`
document.head.appendChild(style)

// Content container
const root = document.getElementById('root')!
root.className = 'znc'

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
    if (event.data.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
})

// Signal ready
window.parent.postMessage({ type: 'ready' }, '*')

// Load Zenn embed script
const script = document.createElement('script')
script.src = 'https://embed.zenn.studio/js/listen-embed-event.js'
document.body.appendChild(script)
