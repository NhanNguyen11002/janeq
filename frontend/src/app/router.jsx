import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '../App.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import LoginPage from '../features/auth/LoginPage.jsx'
import QuizPage from '../features/quiz/QuizPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/quiz',
    element: (
      <ProtectedRoute>
        <QuizPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
