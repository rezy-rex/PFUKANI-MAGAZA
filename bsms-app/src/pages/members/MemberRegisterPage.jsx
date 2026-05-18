import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import { memberSchema } from '../../utils/validators'
import { registerMember } from '../../services/memberService'
import { useAuthStore } from '../../store/authStore'

export default function MemberRegisterPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: '',
      id_number: '',
      phone: '',
      email: '',
      physical_address: '',
      joined_date: new Date().toISOString().split('T')[0],
      consent_given: false,
    },
  })

  const onSubmit = async (formData) => {
    setSubmitting(true)

    const actingUser = {
      id: user.id,
      full_name: profile?.full_name ?? user.email,
      role: profile?.role,
    }

    const { data: newMember, error } = await registerMember(formData, actingUser)
    setSubmitting(false)

    if (error) {
      if (error.includes('ID number')) {
        setError('id_number', { message: error })
      } else {
        toast.error(error)
      }
      return
    }

    toast.success(`${newMember.full_name} registered successfully as ${newMember.member_number}`)
    navigate(`/members/${newMember.id}`)
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title="Register New Member"
        subtitle="All fields marked * are required"
        actions={
          <Link to="/members" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to Members
          </Link>
        }
      >
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Personal Information */}
            <div className="card mb-5">
              <h2 className="section-title mb-5">Personal Information</h2>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="form-label">Full Name *</label>
                  <input
                    id="full_name"
                    type="text"
                    {...register('full_name')}
                    className="form-input"
                    placeholder="e.g. Thabo Nkosi"
                  />
                  {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
                </div>

                {/* SA ID Number */}
                <div>
                  <label htmlFor="id_number" className="form-label">SA ID Number *</label>
                  <input
                    id="id_number"
                    type="text"
                    {...register('id_number')}
                    className="form-input font-mono tracking-widest"
                    placeholder="13-digit SA ID number"
                    maxLength={13}
                  />
                  {errors.id_number && <p className="form-error">{errors.id_number.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="form-label">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="form-input"
                    placeholder="e.g. 0712345678"
                  />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="form-input"
                    placeholder="e.g. thabo@example.com"
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            {/* Address & Membership */}
            <div className="card mb-5">
              <h2 className="section-title mb-5">Address & Membership</h2>

              <div className="space-y-4">
                {/* Physical Address */}
                <div>
                  <label htmlFor="physical_address" className="form-label">Physical Address *</label>
                  <textarea
                    id="physical_address"
                    {...register('physical_address')}
                    className="form-input min-h-[80px] resize-none"
                    placeholder="Street address, suburb, town"
                    rows={3}
                  />
                  {errors.physical_address && <p className="form-error">{errors.physical_address.message}</p>}
                </div>

                {/* Date Joined */}
                <div>
                  <label htmlFor="joined_date" className="form-label">Date Joined *</label>
                  <input
                    id="joined_date"
                    type="date"
                    {...register('joined_date')}
                    className="form-input"
                  />
                  {errors.joined_date && <p className="form-error">{errors.joined_date.message}</p>}
                </div>
              </div>
            </div>

            {/* POPIA Consent */}
            <div className="card mb-6">
              <h2 className="section-title mb-3">POPIA Consent *</h2>
              <p className="text-sm text-gray-500 mb-4">
                This consent must be obtained verbally from the member before registration.
              </p>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  id="consent_given"
                  type="checkbox"
                  {...register('consent_given')}
                  className="mt-0.5 w-5 h-5 accent-brand-green shrink-0 cursor-pointer"
                />
                <span className="text-sm text-brand-charcoal leading-relaxed">
                  I confirm that this member has given their informed consent for their personal information
                  to be collected, processed, and stored in accordance with the{' '}
                  <strong>Protection of Personal Information Act (POPIA)</strong>. The member understands
                  how their information will be used by Pfukani Magaza Burial Society.
                </span>
              </label>
              {errors.consent_given && (
                <p className="form-error mt-2">{errors.consent_given.message}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                id="register-member-btn"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <div className="spinner" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register Member
                  </>
                )}
              </button>
              <Link to="/members" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </PageWrapper>
    </>
  )
}
