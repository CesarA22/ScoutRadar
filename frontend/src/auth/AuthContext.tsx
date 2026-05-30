import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type AuthUser } from '../api/client'
import { applyUserPreferences } from '../lib/preferences'
import { clearToken, getToken, setToken } from './token'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setUser: (user: AuthUser) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function syncPreferences(user: AuthUser) {
  const theme = user.theme === 'light' ? 'light' : 'dark'
  const language = user.language === 'en' || user.language === 'es' ? user.language : 'pt'
  applyUserPreferences(theme, language)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await api.authMe()
    setUser(me)
    syncPreferences(me)
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    let cancelled = false
    api.authMe()
      .then(u => {
        if (!cancelled) {
          setUser(u)
          syncPreferences(u)
        }
      })
      .catch(() => {
        if (!cancelled) logout()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [token, logout])

  const login = useCallback(async (username: string, password: string) => {
    const { access_token } = await api.authLogin(username, password)
    setToken(access_token)
    setTokenState(access_token)
    const me = await api.authMe()
    setUser(me)
    syncPreferences(me)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      refreshUser,
      setUser,
      isAuthenticated: !!token && !!user,
    }),
    [user, token, loading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export type { AuthUser }
