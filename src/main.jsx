import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { ToastProvider } from './components/ui/toast'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
      <Provider store={store}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </Provider>
  )
} else {
  throw new Error(
    "Root element with ID 'root' was not found in your HTML file."
  )
}
