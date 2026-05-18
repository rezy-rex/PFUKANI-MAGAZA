import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import MemberSearchInput from '../../components/ui/MemberSearchInput'
import { useAuthStore } from '../../store/authStore'
import { getBeneficiariesByMember } from '../../services/beneficiaryService'
import { submitClaim } from '../../services/claimService'
import { claimSubmitSchema } from '../../utils/validators'

export default function ClaimSubmitPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [selectedMember, setSelectedMember] = useState(null)
  const [beneficiaries, setBeneficiaries] = useState([])
  const [claimFor, setClaimFor] = useState('member')
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [dateOfDeath, setDateOfDeath] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadBeneficiaries() {
      if (!selectedMember) { setBeneficiaries([]); return }
      const { data } = await getBeneficiariesByMember(selectedMember.id)
      if (!cancelled) setBeneficiaries((data ?? []).filter((beneficiary) => beneficiary.is_active))
    }
    loadBeneficiaries()
    return () => { cancelled = true }
  }, [selectedMember])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!selectedMember) { setError('Please select a member.'); return }

    const formData = {
      member_id: selectedMember.id,
      claim_for: claimFor,
      beneficiary_id: claimFor === 'beneficiary' ? Number(beneficiaryId) : null,
      date_of_death: dateOfDeath,
      notes,
    }
    const validation = claimSubmitSchema.safeParse(formData)
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Please check the claim details.')
      return
    }

    setSubmitting(true)
    const actingUser = { id: user.id, full_name: profile?.full_name ?? user.email }
    const { data, error: err } = await submitClaim(validation.data, selectedMember, actingUser)
    setSubmitting(false)

    if (err) { toast.error(err); return }

    toast.success(`Claim #${data.id} submitted`)
    navigate(`/claims/${data.id}`)
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title="Submit Claim"
        subtitle="Create a new claim and upload supporting documents"
        actions={<Link to="/claims" className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back to Claims</Link>}
      >
        <form onSubmit={handleSubmit} className="max-w-2xl" noValidate>
          <div className="card mb-5">
            <h2 className="section-title mb-4">Member</h2>
            <label className="form-label">Search Member *</label>
            <MemberSearchInput
              onSelect={(member) => { setSelectedMember(member); setError('') }}
              onClear={() => { setSelectedMember(null); setBeneficiaries([]); setBeneficiaryId('') }}
              error={error && !selectedMember ? error : ''}
              disabled={submitting}
            />
          </div>

          <div className="card mb-5">
            <h2 className="section-title mb-4">Claim Details</h2>
            {error && selectedMember && <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="form-label">Claim For *</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {['member', 'beneficiary'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setClaimFor(option)}
                      className={`rounded-lg border px-4 py-3 text-sm font-semibold capitalize ${
                        claimFor === option ? 'border-brand-green bg-green-50 text-brand-green' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {claimFor === 'beneficiary' && (
                <div>
                  <label htmlFor="beneficiary_id" className="form-label">Beneficiary *</label>
                  <select id="beneficiary_id" value={beneficiaryId} onChange={(event) => setBeneficiaryId(event.target.value)} className="form-input">
                    <option value="">Select beneficiary</option>
                    {beneficiaries.map((beneficiary) => (
                      <option key={beneficiary.id} value={beneficiary.id}>
                        {beneficiary.full_name} - {beneficiary.relationship}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="date_of_death" className="form-label">Date of Death *</label>
                <input id="date_of_death" type="date" value={dateOfDeath} onChange={(event) => setDateOfDeath(event.target.value)} className="form-input" />
              </div>

              <div>
                <label htmlFor="notes" className="form-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="form-input resize-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <><div className="spinner" /> Submitting...</> : <><FileText className="w-4 h-4" /> Submit Claim</>}
          </button>
        </form>
      </PageWrapper>
    </>
  )
}
