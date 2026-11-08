import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'

function isAttemptList(data) {
  return (
    Array.isArray(data?.attempts) &&
    data.attempts.every(
      (attempt) =>
        typeof attempt?.attemptId === 'string' &&
        typeof attempt.category === 'string' &&
        typeof attempt.submittedAt === 'string' &&
        Number.isInteger(attempt.score) &&
        Number.isInteger(attempt.totalQuestions) &&
        typeof attempt.percentage === 'number',
    )
  )
}

function formatSubmittedAt(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString()
}

function AttemptHistoryPage() {
  const [attempts, setAttempts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    async function loadAttempts() {
      setIsLoading(true)
      setError('')
      try {
        const data = await apiRequest('/attempts', {
          authRequired: true,
          signal: controller.signal,
        })
        if (!isAttemptList(data)) {
          throw new Error('The server returned attempt history in an unexpected format.')
        }
        setAttempts(data.attempts)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Could not load your history. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadAttempts()
    return () => controller.abort()
  }, [retryCount])

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', {
        replace: true,
        state: {
          notice: 'The server could not confirm sign-out. Please try again when the connection is restored.',
        },
      })
    } finally {
      setIsLoggingOut(false)
    }
  }, [logout, navigate])

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <AppHeader isLoggingOut={isLoggingOut} onLogout={handleLogout} user={user} />

      <div className="mb-5">
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            All topics
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
            YOUR ACTIVITY
          </p>
          <CardTitle className="text-2xl">Quiz history</CardTitle>
          <CardDescription>Review previous attempts and download their results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <div
              aria-busy="true"
              aria-live="polite"
              className="flex items-center justify-center gap-3 py-12 text-muted-foreground"
            >
              <RefreshCw aria-hidden="true" className="size-5 animate-spin" />
              Loading quiz history…
            </div>
          ) : error ? (
            <Alert className="items-start" variant="destructive">
              <AlertTitle>Could not load quiz history</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>
                <Button
                  onClick={() => setRetryCount((count) => count + 1)}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw aria-hidden="true" />
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : attempts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <h3 className="font-medium">No quiz attempts yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed quizzes will appear here.
              </p>
              <Button asChild className="mt-4">
                <Link to="/">Choose a topic</Link>
              </Button>
            </div>
          ) : (
            <ol className="space-y-3">
              {attempts.map((attempt) => (
                <li key={attempt.attemptId}>
                  <Link
                    className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    to={`/history/${encodeURIComponent(attempt.attemptId)}`}
                  >
                    <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                      <CardContent className="flex items-center justify-between gap-4 py-4">
                        <div className="min-w-0 space-y-1">
                          <h3 className="truncate font-semibold">{attempt.category}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatSubmittedAt(attempt.submittedAt)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Score: {attempt.score} / {attempt.totalQuestions} · {attempt.percentage}%
                          </p>
                        </div>
                        <ChevronRight
                          aria-hidden="true"
                          className="size-5 shrink-0 text-muted-foreground"
                        />
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export default AttemptHistoryPage
