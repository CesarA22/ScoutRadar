import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { setUnauthorizedHandler } from './api/client'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { FilterProvider } from './hooks/useFilters'
import './i18n'
import { ChatPage } from './pages/ChatPage'
import { ComparePage } from './pages/ComparePage'
import { ExplorerPage } from './pages/ExplorerPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { OutliersPage } from './pages/OutliersPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function UnauthorizedHandler() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(() => {})
  }, [logout, navigate])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FilterProvider>
          <BrowserRouter>
            <UnauthorizedHandler />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="explorer" element={<ExplorerPage />} />
                <Route path="outliers" element={<OutliersPage />} />
                <Route path="compare" element={<ComparePage />} />
                <Route path="chat" element={<ChatPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </FilterProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
