import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './ThemeContext.jsx'
import AntdProvider from './AntdProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AntdProvider>
          <App />
        </AntdProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
