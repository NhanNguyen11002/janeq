import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '../App.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import LoginPage from '../features/auth/LoginPage.jsx'
import AttemptDetailPage from '../features/history/AttemptDetailPage.jsx'
import AttemptHistoryPage from '../features/history/AttemptHistoryPage.jsx'
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
    path: '/history',
    element: (
      <ProtectedRoute>
        <AttemptHistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/history/:attemptId',
    element: (
      <ProtectedRoute>
        <AttemptDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
