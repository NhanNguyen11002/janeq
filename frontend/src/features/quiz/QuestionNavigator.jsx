function QuestionNavigator({ questions, answers, currentIndex, onNavigate }) {
  return (
    <nav aria-label="Question navigation" className="flex flex-wrap gap-2">
      {questions.map((question, index) => {
        const isCurrent = currentIndex === index
        const isAnswered = Boolean(answers[question.id])
        return (
          <button
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ', unanswered'}`}
            className={`size-10 cursor-pointer rounded-lg border text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transform-none ${
              isCurrent
                ? 'border-primary bg-primary text-primary-foreground'
                : isAnswered
                  ? 'border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
            }`}
            key={question.id}
            onClick={() => onNavigate(index)}
            type="button"
          >
            {index + 1}
          </button>
        )
      })}
    </nav>
  )
}

export default QuestionNavigator
