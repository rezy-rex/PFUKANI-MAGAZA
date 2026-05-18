import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Users, CreditCard, Heart, FileText, BarChart2,
  LogOut, Menu, X, User, TrendingDown
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import AppLogo from '../ui/AppLogo'

const NAV_LINKS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { to: '/members', label: 'Members', icon: Users },
    { to: '/payments/record', label: 'Record Payment', icon: CreditCard },
    { to: '/payments/overdue', label: 'Overdue', icon: TrendingDown },
    { to: '/claims', label: 'Claims', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
  ],
  executive: [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { to: '/members', label: 'Members', icon: Users },
    { to: '/payments/record', label: 'Record Payment', icon: CreditCard },
    { to: '/payments/overdue', label: 'Overdue', icon: TrendingDown },
    { to: '/claims', label: 'Claims', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
  ],
  member: [
    { to: '/dashboard', label: 'My Dashboard', icon: BarChart2 },
    { to: '/payments/history/me', label: 'My Payments', icon: CreditCard },
    { to: '/members/me/beneficiaries', label: 'Beneficiaries', icon: Heart },
    { to: '/claims', label: 'My Claims', icon: FileText },
  ],
}

/**
 * Authenticated navigation bar.
 * Shows role-appropriate navigation links, user name, and logout button.
 * Collapses to hamburger on mobile.
 */
export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const role = profile?.role ?? 'member'
  const links = NAV_LINKS[role] ?? NAV_LINKS.member

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    navigate('/', { replace: true })
  }

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-green shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 shrink-0">
            <AppLogo className="w-9 h-9" />
            <div className="hidden sm:block">
              <span className="text-white font-bold text-lg leading-none">BSMS</span>
              <span className="text-white/70 text-xs block">Pfukani Magaza</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side: user info + logout */}
          <div className="flex items-center gap-3">
            {/* User name */}
            <div className="hidden sm:flex items-center gap-2 text-white/90 text-sm">
              <div className="bg-white/20 rounded-full p-1">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-medium max-w-[140px] truncate">{profile?.full_name ?? 'User'}</span>
              <span className="text-white/50 text-xs capitalize">({role})</span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-60"
            >
              {loggingOut ? (
                <div className="spinner" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white p-1"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-green-800 border-t border-white/10 px-4 py-3 space-y-1">
          {/* User info on mobile */}
          <div className="flex items-center gap-2 px-3 py-2 text-white/70 text-sm border-b border-white/10 mb-2">
            <User className="w-4 h-4" />
            <span>{profile?.full_name ?? 'User'}</span>
            <span className="capitalize ml-auto text-xs">({role})</span>
          </div>
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(to)
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
