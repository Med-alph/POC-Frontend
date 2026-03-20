import './utils/logger-silencer';
import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from './app/store'
import { queryClient } from './lib/queryClient'
import { ToastProvider } from './components/ui/toast'
import { AuthProvider } from './contexts/AuthContext'
// Initialize API interceptor (must be imported before other modules that use fetch)
import './services/apiInterceptor'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </Provider>
  )
} else {
  throw new Error(
    "Root element with ID 'root' was not found in your HTML file."
  )
}
