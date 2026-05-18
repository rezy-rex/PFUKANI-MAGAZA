import { Link } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function AccessDeniedPage() {
  const { profile } = useAuthStore()
  const role = profile?.role ?? 'member'

  const homeLinks = {
    admin: '/dashboard',
    executive: '/dashboard',
    member: '/dashboard',
  }

  return (
    <div className="min-h-screen bg-brand-grey flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="bg-red-100 rounded-full p-6 inline-flex mb-6">
          <ShieldOff className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-brand-charcoal mb-3">Access Denied</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          You don't have permission to view this page. Your account role
          (<strong className="text-brand-charcoal capitalize">{role}</strong>) does not have access to this section.
        </p>
        <Link
          to={homeLinks[role] ?? '/dashboard'}
          className="btn-primary inline-flex"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
