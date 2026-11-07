function CategoryLoadingState() {
  return (
    <div
      aria-label="Loading categories"
      aria-live="polite"
      aria-busy="true"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="h-36 animate-pulse rounded-xl border bg-muted/50"
          key={index}
        />
      ))}
    </div>
  )
}

export default CategoryLoadingState
