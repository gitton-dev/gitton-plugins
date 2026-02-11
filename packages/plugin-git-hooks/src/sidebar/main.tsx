import React from 'react'
import ReactDOM from 'react-dom/client'
import { HookList } from './components/HookList'
import '../globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HookList />
  </React.StrictMode>
)
