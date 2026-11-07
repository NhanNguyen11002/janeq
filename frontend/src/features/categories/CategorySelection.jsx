import { RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import CategoryCard from '@/features/categories/CategoryCard'
import CategoryLoadingState from '@/features/categories/CategoryLoadingState'

function CategorySelection({
  categories,
  selectedCategory,
  error,
  isLoading,
  onSelect,
  onStart,
  onRetry,
}) {
  const selectedTopic = categories.find((category) => category.name === selectedCategory)

  return (
    <Card>
      <CardHeader className="gap-2 border-b pb-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
          QUESTION BANK
        </p>
        <CardTitle className="text-2xl">Choose a quiz topic</CardTitle>
        <CardDescription>
          Select a topic to see how many questions are available.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {isLoading ? (
          <CategoryLoadingState />
        ) : error ? (
          <Alert className="items-start" variant="destructive">
            <AlertTitle>Could not load quiz topics</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button
                className="shrink-0"
                disabled={isLoading}
                onClick={onRetry}
                size="sm"
                variant="outline"
              >
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-6">
            <div>
              <h3 className="font-medium text-foreground">No quiz topics yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                There are no categories available right now. Try loading them again.
              </p>
            </div>
            <Button onClick={onRetry} variant="outline">
              <RefreshCw aria-hidden="true" />
              Refresh topics
            </Button>
          </div>
        ) : (
          <>
            <div
              aria-label="Quiz topics"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              role="group"
            >
              {categories.map((category) => (
                <CategoryCard
                  category={category}
                  isSelected={selectedCategory === category.name}
                  key={category.name}
                  onSelect={() => onSelect(category.name)}
                />
              ))}
            </div>
            {selectedCategory && (
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Selected topic:{' '}
                <span className="font-medium text-foreground">{selectedCategory}</span>
              </p>
            )}
            <Button
              disabled={!selectedTopic || selectedTopic.questionCount === 0}
              onClick={() => onStart(selectedCategory)}
              size="lg"
            >
              Start quiz
            </Button>
          </>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <span aria-live="polite" className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading topics…'
              : error
                ? 'Connection problem'
                : categories.length
                  ? `${categories.length} topics available`
                  : 'No topics available'}
          </span>
          {isLoading && (
            <RefreshCw
              aria-hidden="true"
              className="size-4 animate-spin text-muted-foreground"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CategorySelection
