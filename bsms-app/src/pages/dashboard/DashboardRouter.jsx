import { useAuthStore } from '../../store/authStore'
import AdminDashboard from './AdminDashboard'
import ExecutiveDashboard from './ExecutiveDashboard'
import MemberDashboard from './MemberDashboard'

/**
 * Renders the correct dashboard component based on the authenticated user's role.
 * This lives at /dashboard and is always wrapped by ProtectedRoute.
 */
export default function DashboardRouter() {
  const { profile } = useAuthStore()
  const role = profile?.role ?? 'member'

  if (role === 'admin') return <AdminDashboard />
  if (role === 'executive') return <ExecutiveDashboard />
  return <MemberDashboard />
}
