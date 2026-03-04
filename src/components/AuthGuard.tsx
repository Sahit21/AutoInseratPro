import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const { isActive, isTrialing, loading: subLoading } = useSubscription()

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return fallback || <Navigate to="/login" replace />
  }

  if (!isActive && !isTrialing) {
    return <Navigate to="/pricing" replace />
  }

  return <>{children}</>
}
