import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadCategories() {
      try {
        const response = await fetch('/api/categories', {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Could not load categories (${response.status})`)
        }
        const data = await response.json()
        setCategories(data.categories)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message)
        }
      }
    }

    loadCategories()
    return () => controller.abort()
  }, [])

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">ONLINE QUIZ PLATFORM</p>
        <h1>JaneQ</h1>
        <p>Development environment is running.</p>
      </header>

      <section className="panel" aria-labelledby="categories-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">QUESTION BANK</p>
            <h2 id="categories-title">Available categories</h2>
          </div>
          <span className="status">
            <span className="status-dot" />
            API connected
          </span>
        </div>

        {error ? (
          <p className="message error" role="alert">
            {error}
          </p>
        ) : categories.length ? (
          <ul className="category-list">
            {categories.map((category) => (
              <li className="category-card" key={category.name}>
                <span>{category.name}</span>
                <span className="count">{category.question_count} questions</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="message">Loading categories…</p>
        )}
      </section>
    </main>
  )
}

export default App
