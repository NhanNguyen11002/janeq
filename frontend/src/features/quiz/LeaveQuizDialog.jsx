import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

function LeaveQuizDialog({ isOpen, onStay, onLeave }) {
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
      aria-labelledby="leave-quiz-dialog-title"
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault()
        onStay()
      }}
      ref={dialogRef}
    >
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold" id="leave-quiz-dialog-title">
            Leave this quiz?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your progress in this quiz will be lost if you leave this page.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onStay} variant="outline">
            Stay on quiz
          </Button>
          <Button onClick={onLeave} variant="destructive">
            Leave quiz
          </Button>
        </div>
      </div>
    </dialog>
  )
}

export default LeaveQuizDialog
