import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import AppHeader from '@/components/AppHeader'
import CategorySelection from '@/features/categories/CategorySelection'

function isCategoryList(data) {
  return (
    Array.isArray(data?.categories) &&
    data.categories.every(
      (category) =>
        typeof category?.name === 'string' &&
        category.name.trim().length > 0 &&
        Number.isInteger(category.questionCount) &&
        category.questionCount >= 0,
    )
  )
}

function App() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()

    async function loadCategories() {
      try {
        const data = await apiRequest('/categories', { signal: controller.signal })
        if (!isCategoryList(data)) {
          throw new Error('The server returned categories in an unexpected format.')
        }
        setCategories(data.categories)
        setSelectedCategory((current) =>
          data.categories.some((category) => category.name === current) ? current : '',
        )
        setError('')
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Could not load categories. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadCategories()
    return () => controller.abort()
  }, [retryCount])

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

  function retryLoadingCategories() {
    setError('')
    setIsLoading(true)
    setRetryCount((count) => count + 1)
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <AppHeader
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        user={user}
      />
      <CategorySelection
        categories={categories}
        error={error}
        isLoading={isLoading}
        onRetry={retryLoadingCategories}
        onSelect={setSelectedCategory}
        selectedCategory={selectedCategory}
      />
    </main>
  )
}

export default App
