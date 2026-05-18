import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import { useAuthStore } from '../../store/authStore'
import { getMemberById } from '../../services/memberService'
import {
  addBeneficiary,
  getBeneficiaryById,
  updateBeneficiary,
} from '../../services/beneficiaryService'
import { beneficiarySchema } from '../../utils/validators'

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other']

export default function BeneficiaryFormPage({ mode = 'add' }) {
  const { id, beneficiaryId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const isEdit = mode === 'edit'

  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: { relationship: 'Child' },
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setFetchError(null)

      if (isEdit) {
        const { data, error } = await getBeneficiaryById(beneficiaryId)
        if (cancelled) return
        if (error || !data) { setFetchError(error ?? 'Beneficiary not found'); setLoading(false); return }
        setMember(data.members)
        reset({
          full_name: data.full_name,
          id_number: data.id_number,
          relationship: data.relationship,
          phone: data.phone ?? '',
          date_of_birth: data.date_of_birth,
        })
        setLoading(false)
        return
      }

      const { data, error } = await getMemberById(id)
      if (cancelled) return
      if (error || !data) { setFetchError(error ?? 'Member not found'); setLoading(false); return }
      setMember(data)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [beneficiaryId, id, isEdit, reset])

  const onSubmit = async (formData) => {
    setSubmitting(true)
    const actingUser = {
      id: user.id,
      full_name: profile?.full_name ?? user.email,
    }

    const result = isEdit
      ? await updateBeneficiary(beneficiaryId, formData, actingUser)
      : await addBeneficiary(Number(id), formData, member, actingUser)

    setSubmitting(false)

    if (result.error) { toast.error(result.error); return }

    toast.success(isEdit ? 'Beneficiary updated' : 'Beneficiary added')
    navigate(`/members/${isEdit ? member.id : id}/beneficiaries`)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <PageWrapper title={isEdit ? 'Edit Beneficiary' : 'Add Beneficiary'}>
          <div className="max-w-2xl card animate-pulse space-y-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-10 bg-gray-200 rounded" />)}
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
        title={isEdit ? 'Edit Beneficiary' : 'Add Beneficiary'}
        subtitle={member ? `${member.full_name} · ${member.member_number}` : ''}
        actions={
          <Link to={`/members/${member.id}/beneficiaries`} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        }
      >
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="card mb-6">
              <h2 className="section-title mb-5">Beneficiary Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="form-label">Full Name *</label>
                  <input id="full_name" type="text" {...register('full_name')} className="form-input" />
                  {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="id_number" className="form-label">SA ID Number *</label>
                  <input id="id_number" type="text" maxLength={13} {...register('id_number')} className="form-input" />
                  {errors.id_number && <p className="form-error">{errors.id_number.message}</p>}
                </div>
                <div>
                  <label htmlFor="date_of_birth" className="form-label">Date of Birth *</label>
                  <input id="date_of_birth" type="date" {...register('date_of_birth')} className="form-input" />
                  {errors.date_of_birth && <p className="form-error">{errors.date_of_birth.message}</p>}
                </div>
                <div>
                  <label htmlFor="relationship" className="form-label">Relationship *</label>
                  <select id="relationship" {...register('relationship')} className="form-input">
                    {RELATIONSHIPS.map((relationship) => (
                      <option key={relationship} value={relationship}>{relationship}</option>
                    ))}
                  </select>
                  {errors.relationship && <p className="form-error">{errors.relationship.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="form-label">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input id="phone" type="tel" {...register('phone')} className="form-input" />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <><div className="spinner" /> Saving...</> : <><Save className="w-4 h-4" /> Save Beneficiary</>}
              </button>
              <Link to={`/members/${member.id}/beneficiaries`} className="btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </PageWrapper>
    </>
  )
}
