import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, Pencil, Plus, PowerOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import { useAuthStore } from '../../store/authStore'
import { getMemberById } from '../../services/memberService'
import {
  deactivateBeneficiary,
  getBeneficiariesByMember,
  getMyBeneficiaries,
} from '../../services/beneficiaryService'
import { formatDate } from '../../utils/formatters'

export default function BeneficiaryListPage({ self = false }) {
  const { id } = useParams()
  const { user, profile } = useAuthStore()
  const isMemberRole = profile?.role === 'member'
  const canManage = !isMemberRole
  const canDeactivate = profile?.role === 'admin'

  const [member, setMember] = useState(null)
  const [beneficiaries, setBeneficiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      if (self) {
        const { data, error: err } = await getMyBeneficiaries(user.id)
        if (cancelled) return
        if (err) { setError(err); setLoading(false); return }
        setMember(data.member)
        setBeneficiaries(data.beneficiaries ?? [])
        setLoading(false)
        return
      }

      const [memberRes, beneficiaryRes] = await Promise.all([
        getMemberById(id),
        getBeneficiariesByMember(id),
      ])
      if (cancelled) return

      if (memberRes.error) { setError(memberRes.error); setLoading(false); return }
      if (beneficiaryRes.error) { setError(beneficiaryRes.error); setLoading(false); return }

      setMember(memberRes.data)
      setBeneficiaries(beneficiaryRes.data ?? [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [id, self, user.id])

  const activeCount = beneficiaries.filter((beneficiary) => beneficiary.is_active).length

  const handleDeactivate = async () => {
    if (!confirming) return

    setSubmitting(true)
    const actingUser = {
      id: user.id,
      full_name: profile?.full_name ?? user.email,
    }
    const { error: err } = await deactivateBeneficiary(confirming.id, reason, actingUser)
    setSubmitting(false)

    if (err) { toast.error(err); return }

    toast.success('Beneficiary deactivated')
    setBeneficiaries((current) => current.map((beneficiary) => (
      beneficiary.id === confirming.id ? { ...beneficiary, is_active: false } : beneficiary
    )))
    setConfirming(null)
    setReason('')
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title={self ? 'My Beneficiaries' : 'Beneficiaries'}
        subtitle={member ? `${member.full_name} · ${member.member_number}` : 'Loading...'}
        actions={
          <div className="flex gap-3 flex-wrap">
            {canManage && member && activeCount < 10 && (
              <Link to={`/members/${member.id}/beneficiaries/add`} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Beneficiary
              </Link>
            )}
            {!self && member && (
              <Link to={`/members/${member.id}`} className="btn-secondary">
                <ArrowLeft className="w-4 h-4" /> Back to Member
              </Link>
            )}
          </div>
        }
      >
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div className="card text-center">
            <p className="text-2xl font-bold text-brand-charcoal">{loading ? '...' : activeCount}</p>
            <p className="text-sm text-gray-400 mt-1">Active Beneficiaries</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-brand-charcoal">{loading ? '...' : beneficiaries.length}</p>
            <p className="text-sm text-gray-400 mt-1">Total Records</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-brand-green">{loading ? '...' : 10 - activeCount}</p>
            <p className="text-sm text-gray-400 mt-1">Slots Available</p>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          {error && <div className="p-6 text-center text-red-600 text-sm">{error}</div>}

          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">Full Name</th>
                    <th className="table-header text-left hidden sm:table-cell">Relationship</th>
                    <th className="table-header text-left hidden md:table-cell">ID Number</th>
                    <th className="table-header text-left hidden lg:table-cell">Date of Birth</th>
                    <th className="table-header text-left">Status</th>
                    {canManage && <th className="table-header text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [1, 2, 3, 4].map((item) => (
                        <tr key={item} className="animate-pulse">
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-40" /></td>
                          <td className="table-cell hidden sm:table-cell"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                          <td className="table-cell hidden md:table-cell"><div className="h-3 bg-gray-200 rounded w-32" /></td>
                          <td className="table-cell hidden lg:table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                          <td className="table-cell"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
                          {canManage && <td className="table-cell"><div className="h-6 bg-gray-200 rounded w-20 ml-auto" /></td>}
                        </tr>
                      ))
                    : beneficiaries.length === 0
                    ? (
                        <tr>
                          <td colSpan={canManage ? 6 : 5} className="py-16 text-center">
                            <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400 font-semibold">No beneficiaries recorded yet</p>
                          </td>
                        </tr>
                      )
                    : beneficiaries.map((beneficiary) => (
                        <tr key={beneficiary.id} className={!beneficiary.is_active ? 'bg-gray-50 opacity-75' : ''}>
                          <td className="table-cell font-medium">{beneficiary.full_name}</td>
                          <td className="table-cell hidden sm:table-cell">{beneficiary.relationship}</td>
                          <td className="table-cell hidden md:table-cell font-mono text-xs">{beneficiary.id_number}</td>
                          <td className="table-cell hidden lg:table-cell text-gray-500">{formatDate(beneficiary.date_of_birth)}</td>
                          <td className="table-cell">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              beneficiary.is_active ? 'bg-green-100 text-brand-green' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {beneficiary.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {canManage && (
                            <td className="table-cell text-right">
                              <div className="inline-flex items-center gap-2">
                                <Link
                                  to={`/members/${member.id}/beneficiaries/${beneficiary.id}/edit`}
                                  className="text-brand-green hover:text-green-700"
                                  title="Edit beneficiary"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Link>
                                {canDeactivate && beneficiary.is_active && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirming(beneficiary)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Deactivate beneficiary"
                                  >
                                    <PowerOff className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageWrapper>

      {confirming && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-brand-charcoal mb-2">Deactivate Beneficiary</h2>
            <p className="text-sm text-gray-500 mb-4">
              {confirming.full_name} will be marked inactive and hidden from the active beneficiary count. The record will remain for claim history.
            </p>
            <label htmlFor="deactivate_reason" className="form-label">Reason *</label>
            <textarea
              id="deactivate_reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="form-input resize-none mb-5"
              placeholder="Explain why this beneficiary is being deactivated"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setConfirming(null); setReason('') }}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                className="btn-danger"
                disabled={submitting}
              >
                {submitting ? <><div className="spinner" /> Deactivating...</> : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
