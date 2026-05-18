import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import { statusChangeSchema } from '../../utils/validators'
import { getMemberById, changeMemberStatus } from '../../services/memberService'
import { useAuthStore } from '../../store/authStore'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'inactive', label: 'Inactive' },
]

export default function MemberStatusPage() {
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
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(statusChangeSchema) })

  const selectedStatus = useWatch({ control, name: 'new_status' })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await getMemberById(id)
      if (cancelled) return
      if (error || !data) { setFetchError(error ?? 'Member not found'); setLoading(false); return }
      setMember(data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const onSubmit = async (formData) => {
    setSubmitting(true)
    const actingUser = {
      id: user.id,
      full_name: profile?.full_name ?? user.email,
      role: profile?.role,
    }
    const { error } = await changeMemberStatus(id, formData.new_status, formData.reason, actingUser)
    setSubmitting(false)
    if (error) { toast.error(error); return }
    toast.success(`Member status changed to ${formData.new_status}`)
    navigate(`/members/${id}`)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <PageWrapper title="Change Member Status">
          <div className="max-w-lg card animate-pulse space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}
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
          <div className="card text-center py-12">
            <p className="text-red-600 mb-4">{fetchError}</p>
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
        title="Change Member Status"
        subtitle={`${member?.full_name} · ${member?.member_number}`}
        actions={
          <Link to={`/members/${id}`} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back to Details
          </Link>
        }
      >
        <div className="max-w-lg">
          {/* Current status */}
          <div className="card mb-5">
            <p className="text-sm text-gray-500 mb-2">Current Status</p>
            <StatusBadge status={member?.status} type="member" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="card mb-5">
              <div className="space-y-5">
                {/* New status */}
                <div>
                  <label htmlFor="new_status" className="form-label">New Status *</label>
                  <select id="new_status" {...register('new_status')} className="form-input">
                    <option value="">— Select new status —</option>
                    {STATUS_OPTIONS.filter(s => s.value !== member?.status).map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {errors.new_status && <p className="form-error">{errors.new_status.message}</p>}

                  {/* Preview new badge */}
                  {selectedStatus && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">New status preview:</span>
                      <StatusBadge status={selectedStatus} type="member" />
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="form-label">Reason for Change *</label>
                  <textarea
                    id="reason"
                    {...register('reason')}
                    rows={4}
                    className="form-input resize-none"
                    placeholder="Provide a clear reason for this status change. This will be saved in the audit log."
                  />
                  {errors.reason && <p className="form-error">{errors.reason.message}</p>}
                </div>
              </div>
            </div>

            {/* Warning for destructive statuses */}
            {['deceased', 'resigned'].includes(selectedStatus) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-sm text-amber-800">
                <strong>Note:</strong> Setting a member to <strong>{selectedStatus}</strong> is significant.
                This action will be logged and cannot be reversed without Admin intervention.
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={selectedStatus === 'active' ? 'btn-primary' : 'btn-danger'}
              >
                {submitting ? (
                  <><div className="spinner" /> Saving...</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Confirm Status Change</>
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
