import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Spinner } from './ui/Spinner'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, token } = useAuth()
  const location = useLocation()

  if (loading && token) {
    return (
      <div className="fut-bg min-h-[100dvh] flex items-center justify-center">
        <Spinner className="w-12 h-12" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
