import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { router } from './app/router.jsx'

try {
  window.localStorage.removeItem('janeq.session')
} catch (error) {
  console.warn('Unable to clear the previous browser session.', error)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
