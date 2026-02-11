import React from 'react'
import ReactDOM from 'react-dom/client'
import { WorkflowList } from './components/WorkflowList'
import '../globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorkflowList />
  </React.StrictMode>
)
