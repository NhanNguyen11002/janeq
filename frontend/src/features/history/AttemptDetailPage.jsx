import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import AttemptExportButton from '@/features/attempts/AttemptExportButton'
import AttemptResultReview from '@/features/attempts/AttemptResultReview'
import { apiRequest } from '@/lib/api'

function isAttempt(data) {
  return (
    typeof data?.attemptId === 'string' &&
    typeof data.category === 'string' &&
    typeof data.submittedAt === 'string' &&
    Number.isInteger(data.score) &&
    Number.isInteger(data.totalQuestions) &&
    typeof data.percentage === 'number' &&
    Array.isArray(data.results) &&
    data.results.every(
      (item) =>
        typeof item?.questionId === 'string' &&
        typeof item.question === 'string' &&
        (item.options === undefined ||
          (Array.isArray(item.options) &&
            item.options.every((option) => typeof option === 'string'))) &&
        (typeof item.selectedAnswer === 'string' || item.selectedAnswer === null) &&
        typeof item.correctAnswer === 'string' &&
        typeof item.isCorrect === 'boolean',
    )
  )
}

function formatSubmittedAt(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString()
}

function AttemptDetailPage() {
  const { attemptId } = useParams()
  const [attempt, setAttempt] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    async function loadAttempt() {
      setIsLoading(true)
      setError('')
      try {
        const data = await apiRequest(`/attempts/${encodeURIComponent(attemptId)}`, {
          authRequired: true,
          signal: controller.signal,
        })
        if (!isAttempt(data)) {
          throw new Error('The server returned attempt details in an unexpected format.')
        }
        setAttempt(data)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Could not load this attempt. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadAttempt()
    return () => controller.abort()
  }, [attemptId, retryCount])

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
    <main className="janeq-enter mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <AppHeader isLoggingOut={isLoggingOut} onLogout={handleLogout} user={user} />

      <div className="mb-5">
        <Button asChild variant="ghost">
          <Link to="/history">
            <ArrowLeft aria-hidden="true" />
            Quiz history
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Card className="janeq-enter">
          <CardContent
            aria-busy="true"
            aria-live="polite"
            className="flex items-center justify-center gap-3 py-16 text-muted-foreground"
            role="status"
          >
            <RefreshCw
              aria-hidden="true"
              className="size-5 animate-spin motion-reduce:animate-none"
            />
            Loading attempt…
          </CardContent>
        </Card>
      ) : error ? (
        <Alert className="janeq-enter items-start" variant="destructive">
          <AlertTitle>Could not load attempt</AlertTitle>
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
      ) : attempt ? (
        <Card className="janeq-enter">
          <CardHeader className="border-b">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
              COMPLETED ATTEMPT
            </p>
            <CardTitle className="break-words text-2xl">{attempt.category}</CardTitle>
            <CardDescription>{formatSubmittedAt(attempt.submittedAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <p className="text-2xl font-semibold">
              Score: {attempt.score} / {attempt.totalQuestions}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({attempt.percentage}%)
              </span>
            </p>
            <AttemptResultReview results={attempt.results} />
            <AttemptExportButton
              attemptId={attempt.attemptId}
              submittedAt={attempt.submittedAt}
            />
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}

export default AttemptDetailPage
