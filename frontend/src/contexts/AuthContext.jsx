import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, apiRequest } from '@/lib/api'

const AuthContext = createContext(null)

function isValidUser(user) {
  return typeof user?.id === 'number' && typeof user?.username === 'string'
}

async function fetchCurrentUser(signal) {
  const data = await apiRequest('/auth/me', { signal })
  if (!isValidUser(data)) {
    throw new Error('The server returned invalid session information.')
  }
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')

  const refreshSession = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
      setSessionError('')
    }
    try {
      const data = await fetchCurrentUser()
      setUser(data)
      return data
    } catch (error) {
      setUser(null)
      if (!(error instanceof ApiError && error.statusCode === 401)) {
        setSessionError(error.message || 'Unable to verify your sign-in. Please try again.')
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchCurrentUser(controller.signal)
      .then(setUser)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setUser(null)
          if (!(error instanceof ApiError && error.statusCode === 401)) {
            setSessionError(error.message || 'Unable to verify your sign-in. Please try again.')
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('janeq:unauthorized', clearSession)
    return () => window.removeEventListener('janeq:unauthorized', clearSession)
  }, [clearSession])

  const login = useCallback(async (username, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    if (!isValidUser(data)) {
      throw new Error('The server returned incomplete login information. Please try again.')
    }

    setUser(data)
    setSessionError('')
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      sessionError,
      refreshSession,
      login,
      logout,
    }),
    [user, isLoading, sessionError, refreshSession, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
