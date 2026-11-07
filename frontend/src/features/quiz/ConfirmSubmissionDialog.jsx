import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

function ConfirmSubmissionDialog({
  isOpen,
  unansweredCount,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  return (
    <dialog
      aria-labelledby="submit-dialog-title"
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault()
        if (!isSubmitting) onCancel()
      }}
      ref={dialogRef}
    >
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold" id="submit-dialog-title">
            Submit this quiz?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {unansweredCount
              ? `${unansweredCount} ${unansweredCount === 1 ? 'question is' : 'questions are'} unanswered. You can go back and complete ${unansweredCount === 1 ? 'it' : 'them'}, or submit now.`
              : 'You have answered every question. Your answers will be submitted for scoring.'}
          </p>
        </div>
        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button disabled={isSubmitting} onClick={onCancel} variant="outline">
            Keep answering
          </Button>
          <Button disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? 'Submitting…' : 'Submit quiz'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

export default ConfirmSubmissionDialog
