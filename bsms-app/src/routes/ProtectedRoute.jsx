import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Wraps protected routes. Behaviour:
 * - If still initialising → show full-screen spinner
 * - If not authenticated → redirect to '/' (the landing page, NOT /login)
 * - If authenticated but wrong role → redirect to '/access-denied'
 * - Otherwise → render children
 *
 * Props:
 *   allowedRoles  string[]  Optional. If provided, only these roles can access the route.
 *   children      ReactNode The page component to render.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, initialised } = useAuthStore()

  // Still checking session — show spinner
  if (loading || !initialised) {
    return (
      <div className="min-h-screen bg-brand-grey flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent mx-auto mb-4" />
          <p className="text-brand-charcoal text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in → back to landing page
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Logged in but role not allowed → access denied
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}
