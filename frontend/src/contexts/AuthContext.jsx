import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'

const SESSION_STORAGE_KEY = 'janeq.session'
const AuthContext = createContext(null)

function readStoredSession() {
  const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!storedSession) {
    return null
  }

  try {
    const session = JSON.parse(storedSession)
    if (
      typeof session?.token === 'string' &&
      session.token.length > 0 &&
      typeof session.user?.id === 'number'
    ) {
      return session
    }
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY)
  return null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    setSession(null)
  }, [])

  useEffect(() => {
    window.addEventListener('janeq:unauthorized', logout)
    return () => window.removeEventListener('janeq:unauthorized', logout)
  }, [logout])

  const login = useCallback(async (username, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    if (
      typeof data?.accessToken !== 'string' ||
      typeof data?.id !== 'number' ||
      typeof data?.username !== 'string'
    ) {
      throw new Error('The server returned incomplete login information. Please try again.')
    }

    const nextSession = {
      token: data.accessToken,
      user: {
        id: data.id,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        image: data.image,
      },
    }
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession.user
  }, [])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout],
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
