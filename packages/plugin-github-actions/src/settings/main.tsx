import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthStatus } from './components/AuthStatus'
import '../globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-4">
      <AuthStatus />
    </div>
  </React.StrictMode>
)
