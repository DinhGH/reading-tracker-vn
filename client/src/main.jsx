import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SandboxPage from './sandbox/SandboxPage.jsx'

const pathname = window.location.pathname
const isSandboxRoute =
  pathname === '/sandbox' || pathname.startsWith('/sandbox/')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSandboxRoute ? <SandboxPage /> : <App />}
  </StrictMode>,
)
