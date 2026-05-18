import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import { memberEditSchema } from '../../utils/validators'
import { getMemberById, updateMember } from '../../services/memberService'
import { useAuthStore } from '../../store/authStore'

export default function MemberEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(memberEditSchema) })

  // Load existing member data to pre-fill the form
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await getMemberById(id)
      if (cancelled) return
      if (error || !data) { setFetchError(error ?? 'Member not found'); setLoading(false); return }
      setMember(data)
      reset({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email ?? '',
        physical_address: data.physical_address,
        joined_date: data.joined_date,
      })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, reset])

  const onSubmit = async (formData) => {
    setSubmitting(true)
    const actingUser = {
      id: user.id,
      full_name: profile?.full_name ?? user.email,
      role: profile?.role,
    }
    const { error } = await updateMember(id, formData, actingUser)
    setSubmitting(false)

    if (error) { toast.error(error); return }
    toast.success('Member updated successfully')
    navigate(`/members/${id}`)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <PageWrapper title="Edit Member">
          <div className="max-w-2xl card animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}
          </div>
        </PageWrapper>
      </>
    )
  }

  if (fetchError) {
    return (
      <>
        <Navbar />
        <PageWrapper>
          <div className="card text-center py-16">
            <p className="text-red-600 font-semibold mb-4">{fetchError}</p>
            <Link to="/members" className="btn-primary inline-flex"><ArrowLeft className="w-4 h-4" /> Back</Link>
          </div>
        </PageWrapper>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title="Edit Member"
        subtitle={member?.member_number}
        actions={
          <Link to={`/members/${id}`} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back to Details
          </Link>
        }
      >
        <div className="max-w-2xl">
          {/* Read-only fields */}
          <div className="card mb-5 bg-gray-50 border border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Read-only fields</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Member Number</p>
                <p className="font-mono font-semibold text-brand-green">{member?.member_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">SA ID Number</p>
                <p className="font-mono font-semibold text-brand-charcoal">{member?.id_number}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="card mb-5">
              <h2 className="section-title mb-5">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="form-label">Full Name *</label>
                  <input id="full_name" type="text" {...register('full_name')} className="form-input" />
                  {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="form-label">Phone Number *</label>
                  <input id="phone" type="tel" {...register('phone')} className="form-input" />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input id="email" type="email" {...register('email')} className="form-input" />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <h2 className="section-title mb-5">Address & Membership</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="physical_address" className="form-label">Physical Address *</label>
                  <textarea id="physical_address" {...register('physical_address')} rows={3} className="form-input resize-none" />
                  {errors.physical_address && <p className="form-error">{errors.physical_address.message}</p>}
                </div>
                <div>
                  <label htmlFor="joined_date" className="form-label">Date Joined *</label>
                  <input id="joined_date" type="date" {...register('joined_date')} className="form-input" />
                  {errors.joined_date && <p className="form-error">{errors.joined_date.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? (
                  <><div className="spinner" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
              </button>
              <Link to={`/members/${id}`} className="btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </PageWrapper>
    </>
  )
}
