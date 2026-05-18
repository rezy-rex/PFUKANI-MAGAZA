import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuthStore } from '../../store/authStore'
import { getClaims } from '../../services/claimService'
import { formatCurrency, formatDate } from '../../utils/formatters'

const STATUSES = ['', 'submitted', 'under_review', 'approved', 'rejected', 'paid']
const STATUS_LABELS = {
  '': 'All Statuses',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
}

export default function ClaimsListPage() {
  const [searchParams] = useSearchParams()
  const { profile } = useAuthStore()
  const isMemberRole = profile?.role === 'member'
  const memberId = searchParams.get('memberId')

  const [claims, setClaims] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const { data, error: err } = await getClaims({ profile, memberId, status })
      if (cancelled) return
      if (err) { setError(err); setLoading(false); return }
      setClaims(data ?? [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [memberId, profile, status])

  return (
    <>
      <Navbar />
      <PageWrapper
        title={isMemberRole ? 'My Claims' : 'Claims'}
        subtitle={`${claims.length} claim${claims.length !== 1 ? 's' : ''}`}
        actions={!isMemberRole && (
          <Link to="/claims/submit" className="btn-primary">
            <Plus className="w-4 h-4" /> Submit Claim
          </Link>
        )}
      >
        {!isMemberRole && (
          <div className="card mb-5">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-input sm:w-56">
              {STATUSES.map((option) => <option key={option} value={option}>{STATUS_LABELS[option]}</option>)}
            </select>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          {error && <div className="p-6 text-center text-red-600 text-sm">{error}</div>}
          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">Claim ID</th>
                    <th className="table-header text-left">Member</th>
                    <th className="table-header text-left hidden md:table-cell">Submitted</th>
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-left hidden lg:table-cell">Approved Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [1, 2, 3, 4].map((item) => (
                        <tr key={item} className="animate-pulse">
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-40" /></td>
                          <td className="table-cell hidden md:table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                          <td className="table-cell"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
                          <td className="table-cell hidden lg:table-cell"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                        </tr>
                      ))
                    : claims.length === 0
                    ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400 font-semibold">No claims found</p>
                          </td>
                        </tr>
                      )
                    : claims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-green-50 transition-colors">
                          <td className="table-cell font-mono">
                            <Link to={`/claims/${claim.id}`} className="text-brand-green font-semibold">#{claim.id}</Link>
                          </td>
                          <td className="table-cell">
                            <p className="font-medium">{claim.members?.full_name}</p>
                            <p className="text-xs text-gray-400 font-mono">{claim.members?.member_number}</p>
                          </td>
                          <td className="table-cell hidden md:table-cell text-gray-500">{formatDate(claim.submitted_at)}</td>
                          <td className="table-cell"><StatusBadge status={claim.status} type="claim" /></td>
                          <td className="table-cell hidden lg:table-cell">{claim.amount_approved ? formatCurrency(claim.amount_approved) : '-'}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
