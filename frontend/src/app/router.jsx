import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '../App.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
