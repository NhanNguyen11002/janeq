import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import AttemptExportButton from '@/features/attempts/AttemptExportButton'
import AttemptResultReview from '@/features/attempts/AttemptResultReview'
import ConfirmSubmissionDialog from '@/features/quiz/ConfirmSubmissionDialog'
import QuestionNavigator from '@/features/quiz/QuestionNavigator'
import QuizQuestion from '@/features/quiz/QuizQuestion'
import { apiRequest } from '@/lib/api'

function isQuestionList(data) {
  return (
    Array.isArray(data?.questions) &&
    data.questions.every(
      (question) =>
        typeof question?.id === 'string' &&
        typeof question.question === 'string' &&
        Array.isArray(question.options) &&
        question.options.length > 0 &&
        question.options.every((option) => typeof option === 'string'),
    ) &&
    new Set(data.questions.map((question) => question.id)).size === data.questions.length
  )
}

function QuizPage() {
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')?.trim() || ''
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!category) {
      navigate('/', { replace: true })
      return undefined
    }

    const controller = new AbortController()
    async function loadQuestions() {
      setIsLoading(true)
      setLoadError('')
      setQuestions([])
      setAnswers({})
      setCurrentIndex(0)
      try {
        const data = await apiRequest(
          `/questions?category=${encodeURIComponent(category)}`,
          { signal: controller.signal, authRequired: true },
        )
        if (!isQuestionList(data)) {
          throw new Error('The server returned questions in an unexpected format.')
        }
        setQuestions(data.questions)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLoadError(error.message || 'Could not load questions. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadQuestions()
    return () => controller.abort()
  }, [category, navigate, retryCount])

  const unansweredCount = useMemo(
    () => questions.filter((question) => !answers[question.id]).length,
    [answers, questions],
  )

  async function handleLogout() {
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
  }

  async function submitQuiz() {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const submitted = await apiRequest(
        '/attempts',
        {
          method: 'POST',
          body: { category, answers },
          authRequired: true,
        },
      )
      if (
        typeof submitted?.attemptId !== 'string' ||
        !Number.isInteger(submitted.score) ||
        !Number.isInteger(submitted.totalQuestions) ||
        !Array.isArray(submitted.results)
      ) {
        throw new Error('The server returned an unexpected quiz result.')
      }
      setResult(submitted)
      setIsConfirmOpen(false)
    } catch (error) {
      setSubmitError(error.message || 'Could not submit your quiz. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentQuestion = questions[currentIndex]

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <AppHeader isLoggingOut={isLoggingOut} onLogout={handleLogout} user={user} />

      <div className="mb-5">
        <Button onClick={() => navigate('/')} variant="ghost">
          <ArrowLeft aria-hidden="true" />
          All topics
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <RefreshCw aria-hidden="true" className="size-5 animate-spin" />
            Loading questions…
          </CardContent>
        </Card>
      ) : loadError ? (
        <Alert className="items-start" variant="destructive">
          <AlertTitle>Could not load this quiz</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
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
      ) : result ? (
        <Card>
          <CardHeader>
            <CardTitle>Quiz submitted</CardTitle>
            <CardDescription>{category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-2xl font-semibold">
              Score: {result.score} / {result.totalQuestions}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({result.percentage}%)
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Your answers have been saved to your quiz history.
            </p>
            <AttemptResultReview results={result.results} />
            <div className="flex flex-wrap gap-3">
              <AttemptExportButton
                attemptId={result.attemptId}
                submittedAt={result.submittedAt}
              />
              <Button onClick={() => navigate('/')}>Choose another topic</Button>
            </div>
          </CardContent>
        </Card>
      ) : questions.length === 0 ? (
        <Alert>
          <AlertTitle>No questions available</AlertTitle>
          <AlertDescription>
            This topic does not have any questions yet. Choose another topic to continue.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader className="border-b">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
              {category}
            </p>
            <CardTitle className="text-2xl">Your quiz</CardTitle>
            <CardDescription>
              Question {currentIndex + 1} of {questions.length} · {questions.length - unansweredCount} answered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-7 pt-6">
            <QuestionNavigator
              answers={answers}
              currentIndex={currentIndex}
              onNavigate={setCurrentIndex}
              questions={questions}
            />
            <div className="border-t pt-6">
              <QuizQuestion
                onSelect={(answer) =>
                  setAnswers((current) => ({ ...current, [currentQuestion.id]: answer }))
                }
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                selectedAnswer={answers[currentQuestion.id] || ''}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((index) => index - 1)}
                variant="outline"
              >
                <ArrowLeft aria-hidden="true" />
                Previous
              </Button>
              <div className="flex gap-2">
                {currentIndex < questions.length - 1 && (
                  <Button onClick={() => setCurrentIndex((index) => index + 1)} variant="outline">
                    Next
                    <ArrowRight aria-hidden="true" />
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setSubmitError('')
                    setIsConfirmOpen(true)
                  }}
                  variant="destructive"
                >
                  Submit quiz
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmSubmissionDialog
        error={submitError}
        isOpen={isConfirmOpen}
        isSubmitting={isSubmitting}
        onCancel={() => {
          if (!isSubmitting) {
            setIsConfirmOpen(false)
            setSubmitError('')
          }
        }}
        onConfirm={submitQuiz}
        unansweredCount={unansweredCount}
      />
    </main>
  )
}

export default QuizPage
