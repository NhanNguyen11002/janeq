import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import './App.css'

function App() {
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()

    async function loadCategories() {
      try {
        const data = await apiRequest('/categories', { signal: controller.signal })
        setCategories(data.categories)
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
  }, [])

  async function handleLogout() {
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
    }
  }

  return (
    <main className="page">
      <header className="mb-12 flex items-start justify-between gap-4">
        <div className="hero mb-0">
          <p className="eyebrow">ONLINE QUIZ PLATFORM</p>
          <h1>JaneQ</h1>
          <p>Welcome, {user?.firstName || user?.username}.</p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Log out
        </Button>
      </header>

      <section className="panel" aria-labelledby="categories-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">QUESTION BANK</p>
            <h2 id="categories-title">Available categories</h2>
          </div>
          <span className="status">
            <span className="status-dot" />
            {isLoading ? 'Loading' : 'API connected'}
          </span>
        </div>

        {error ? (
          <p className="message error" role="alert">
            {error}
          </p>
        ) : isLoading ? (
          <p className="message">Loading categories…</p>
        ) : categories.length ? (
          <ul className="category-list">
            {categories.map((category) => (
              <li className="category-card" key={category.name}>
                <span>{category.name}</span>
                <span className="count">{category.questionCount} questions</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="message">No categories are available.</p>
        )}
      </section>
    </main>
  )
}

export default App
