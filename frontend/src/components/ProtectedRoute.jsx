import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, refreshSession, sessionError } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </main>
    )
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Unable to verify your session</AlertTitle>
            <AlertDescription>{sessionError}</AlertDescription>
          </Alert>
          <Button className="w-full" onClick={refreshSession} variant="outline">
            Try again
          </Button>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
