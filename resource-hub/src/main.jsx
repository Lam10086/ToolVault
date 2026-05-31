import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DBProvider } from './context/DBContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DBProvider>
      <App />
    </DBProvider>
  </StrictMode>,
)
