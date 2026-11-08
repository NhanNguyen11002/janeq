import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function LoginPage() {
  const { isAuthenticated, isLoading: isCheckingSession, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isCheckingSession) {
    return (
      <main className="janeq-enter flex min-h-screen items-center justify-center">
        <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
          Checking your session…
        </p>
      </main>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(username.trim(), password)
      const returnTo = location.state?.from?.pathname || '/'
      navigate(returnTo, { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="janeq-enter flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-muted-foreground">
            ONLINE QUIZ PLATFORM
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">JaneQ</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your quizzes.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Use your DummyJSON demo account to sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form aria-busy={isSubmitting} className="space-y-5" onSubmit={handleSubmit}>
              {location.state?.notice && (
                <Alert>
                  <AlertTitle>Sign-out notice</AlertTitle>
                  <AlertDescription>{location.state.notice}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert id="sign-in-error" variant="destructive">
                  <AlertTitle>Sign-in failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <Input
                  autoComplete="username"
                  autoFocus
                  disabled={isSubmitting}
                  aria-describedby={error ? 'sign-in-error' : undefined}
                  aria-invalid={Boolean(error)}
                  id="username"
                  name="username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  required
                  value={username}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-describedby={error ? 'sign-in-error' : undefined}
                  aria-invalid={Boolean(error)}
                  id="password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  type="password"
                  value={password}
                />
              </div>

              <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default LoginPage
