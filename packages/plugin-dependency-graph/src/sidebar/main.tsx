import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

function init() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

if (window.gitton) {
  init()
} else {
  window.addEventListener('gitton:ready', init)
}
