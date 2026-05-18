import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Briefcase, User, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import AppLogo from '../../components/ui/AppLogo'

// ── Role card data ────────────────────────────────────────────
const ROLES = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'Directors — Full system access',
    icon: Shield,
    color: 'border-brand-green bg-green-50 hover:bg-green-100',
    selectedColor: 'border-brand-green bg-brand-green text-white',
    iconColor: 'text-brand-green',
    selectedIconColor: 'text-white',
  },
  {
    id: 'executive',
    label: 'Executive',
    description: 'Staff — Payments, claims and reports',
    icon: Briefcase,
    color: 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100',
    selectedColor: 'border-brand-yellow bg-brand-yellow text-brand-charcoal',
    iconColor: 'text-yellow-600',
    selectedIconColor: 'text-brand-charcoal',
  },
  {
    id: 'member',
    label: 'Member',
    description: 'View your account and payments',
    icon: User,
    color: 'border-blue-400 bg-blue-50 hover:bg-blue-100',
    selectedColor: 'border-blue-600 bg-blue-600 text-white',
    iconColor: 'text-blue-600',
    selectedIconColor: 'text-white',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuthStore()

  // Step 1 = role selection, Step 2 = email/password form
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState(null)

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedRoleData = ROLES.find((r) => r.id === selectedRole)

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId)
    setStep(2)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    setError('')

    const { error: signInError } = await signIn(email.trim(), password)

    setLoading(false)

    if (signInError) {
      setError('Invalid email or password.')
      return
    }

    // Navigate to dashboard — role-based redirect happens there
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-brand-green flex items-center justify-center px-4 py-12">
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full translate-x-1/3" />
      </div>

      <div className="relative z-10 w-full max-w-md min-w-0">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-white rounded-full p-3 shadow-2xl ring-4 ring-brand-yellow/30 mb-4">
            <AppLogo className="w-20 h-20" />
          </div>
          <h1 className="text-white font-bold text-2xl">Pfukani Magaza BSMS</h1>
          <p className="text-white/60 text-sm mt-1">Burial Society Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="bg-brand-green px-6 py-5">
            <h2 className="text-white font-bold text-xl">
              {step === 1 ? 'Select Your Role' : 'Welcome Back'}
            </h2>
            <p className="text-white/70 text-sm mt-0.5">
              {step === 1
                ? 'Choose the account type you are logging in as'
                : 'Enter your credentials to continue'}
            </p>
          </div>

          <div className="p-6">
            {/* ── STEP 1: Role Selection ── */}
            {step === 1 && (
              <div>
                <div className="space-y-3">
                  {ROLES.map(({ id, label, description, icon: Icon, color, iconColor }) => (
                    <button
                      key={id}
                      onClick={() => handleRoleSelect(id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left group ${color}`}
                    >
                      <div className={`${iconColor} shrink-0`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-brand-charcoal text-base">{label}</p>
                        <p className="text-gray-500 text-sm">{description}</p>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-gray-400 ml-auto rotate-180 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <Link to="/" className="text-brand-green text-sm hover:underline font-medium flex items-center gap-1 justify-center">
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                  </Link>
                </div>
              </div>
            )}

            {/* ── STEP 2: Login Form ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} noValidate>
                {/* Role badge */}
                {selectedRoleData && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-5">
                    <selectedRoleData.icon className="w-4 h-4 text-brand-green shrink-0" />
                    <span className="text-sm text-brand-charcoal">
                      Logging in as <strong className="text-brand-green">{selectedRoleData.label}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError('') }}
                      className="ml-auto text-xs text-gray-400 hover:text-brand-green underline"
                    >
                      Wrong role?
                    </button>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Email */}
                <div className="mb-4">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="form-input"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input pr-11"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-charcoal transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={loading}
                  className="btn-primary w-full text-base py-3"
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Back to role selection */}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
                    className="text-sm text-gray-400 hover:text-brand-green transition-colors flex items-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to role selection
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/40 text-xs mt-6">
          © {new Date().getFullYear()} Pfukani Magaza Forum · BSMS v1.0
        </p>
      </div>
    </div>
  )
}
