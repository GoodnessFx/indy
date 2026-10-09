import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSeedData } from './lib/seedData'

// Pre-populate demo records (only writes if the key is absent — never
// overwrites real admin edits).
initSeedData()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
