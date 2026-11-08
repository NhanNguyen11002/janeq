import { Check, CircleHelp, X } from 'lucide-react'

function AttemptResultReview({ results }) {
  return (
    <section aria-labelledby="answer-review-title" className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold" id="answer-review-title">
          Answer review
        </h3>
        <p className="text-sm text-muted-foreground">
          Review your answer and the correct answer for each question.
        </p>
      </div>

      <ol className="space-y-3">
        {results.map((item, index) => {
          const isAnswered = typeof item.selectedAnswer === 'string'

          return (
            <li
              className="janeq-enter rounded-lg border p-4 sm:p-5"
              style={{ '--janeq-enter-delay': `${Math.min(index, 6) * 35}ms` }}
              key={item.questionId}
            >
              <div className="mb-4 flex items-start gap-3">
                <span className="shrink-0 text-xs font-semibold tracking-wide text-muted-foreground">
                  QUESTION {index + 1}
                </span>
                <p className="min-w-0 break-words font-medium leading-relaxed text-foreground">
                  {item.question}
                </p>
              </div>

              <div className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
                <CircleHelp aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  {isAnswered ? (
                    <>
                      <span className="font-semibold">Your answer:</span>{' '}
                      {item.selectedAnswer}
                    </>
                  ) : (
                    <span className="font-semibold">You did not select an answer.</span>
                  )}
                </span>
              </div>

              {Array.isArray(item.options) ? (
                <ul
                  aria-label={`Answer options for question ${index + 1}`}
                  className="space-y-2"
                >
                  {item.options.map((option, optionIndex) => {
                    const isSelected = item.selectedAnswer === option
                    const isCorrect = item.correctAnswer === option
                    const isMarkedCorrect = isSelected && item.isCorrect
                    const isMarkedIncorrect = isSelected && !item.isCorrect
                    const optionLabel = isMarkedCorrect
                      ? 'Your answer · Correct'
                      : isMarkedIncorrect
                        ? 'Your answer · Incorrect'
                        : isCorrect
                          ? 'Correct answer'
                          : ''

                    return (
                      <li
                        className={`flex min-w-0 flex-wrap items-start justify-between gap-2 rounded-md border p-3 text-sm ${
                          isMarkedCorrect || (!isSelected && isCorrect)
                            ? 'border-green-600/30 bg-green-500/10 text-green-800 dark:text-green-300'
                            : isMarkedIncorrect
                              ? 'border-red-600/30 bg-red-500/10 text-red-800 dark:text-red-300'
                              : 'border-border text-foreground'
                        }`}
                        key={`${item.questionId}-${optionIndex}`}
                      >
                        <span className="min-w-0 flex-1 break-words">{option}</span>
                        {optionLabel && (
                          <span className="inline-flex items-center gap-1 font-semibold">
                            {isMarkedIncorrect ? (
                              <X aria-hidden="true" className="size-4" />
                            ) : (
                              <Check aria-hidden="true" className="size-4" />
                            )}
                            {optionLabel}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="rounded-md border border-muted-foreground/20 bg-muted/40 p-3 text-sm text-muted-foreground">
                  Answer options are unavailable for this saved attempt.
                  {item.correctAnswer && (
                    <span className="mt-1 block font-medium text-green-800 dark:text-green-300">
                      Correct answer: {item.correctAnswer}
                    </span>
                  )}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default AttemptResultReview
