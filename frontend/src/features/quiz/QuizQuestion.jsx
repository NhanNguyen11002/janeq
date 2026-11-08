function QuizQuestion({ question, questionNumber, selectedAnswer, onSelect }) {
  return (
    <fieldset className="space-y-5">
      <legend className="text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
        <span className="mb-2 block text-sm font-medium text-muted-foreground">
          Question {questionNumber}
        </span>
        {question.question}
      </legend>
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const optionId = `option-${question.id}-${index}`
          return (
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-[background-color,border-color,box-shadow] duration-200 focus-within:ring-3 focus-within:ring-ring/50 ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              htmlFor={optionId}
              key={optionId}
            >
              <input
                checked={isSelected}
                className="mt-1 accent-primary"
                id={optionId}
                name={question.id}
                onChange={() => onSelect(option)}
                type="radio"
                value={option}
              />
              <span className="text-sm leading-relaxed text-foreground">{option}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default QuizQuestion
