import { Check } from 'lucide-react'

function CategoryCard({ category, isSelected, onSelect }) {
  return (
    <button
      aria-pressed={isSelected}
      className={`group flex min-h-36 w-full cursor-pointer flex-col items-start justify-between rounded-xl border p-5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
      }`}
      onClick={onSelect}
      type="button"
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className="break-words text-base font-semibold leading-snug text-foreground">
          {category.name}
        </span>
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-transparent group-hover:border-primary/50'
          }`}
        >
          <Check aria-hidden="true" className="size-4" />
        </span>
      </span>
      <span className="text-sm text-muted-foreground">
        {category.questionCount} {category.questionCount === 1 ? 'question' : 'questions'}
      </span>
    </button>
  )
}

export default CategoryCard
