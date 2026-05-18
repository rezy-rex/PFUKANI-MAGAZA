import { useState } from 'react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import StatCard from '../../components/ui/StatCard'
import { Heart, DollarSign } from 'lucide-react'

const ITEMS_PER_PAGE = 15

export default function ClaimsSummaryReportDisplay({ data }) {
  const [page, setPage] = useState(1)

  const start = (page - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const claims = data.claims.slice(start, end)
  const totalPages = Math.ceil(data.claims.length / ITEMS_PER_PAGE)

  const statusColors = {
    submitted: 'bg-blue-100 text-blue-600',
    under_review: 'bg-yellow-100 text-yellow-600',
    approved: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
    paid: 'bg-green-100 text-brand-green'
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Claims" value={data.totalClaims} icon={Heart} color="bg-pink-100 text-pink-600" />
        <StatCard title="Approved" value={data.statusBreakdown.approved} icon={Heart} color="bg-green-100 text-brand-green" />
        <StatCard title="Total Approved" value={formatCurrency(data.totalApprovedAmount)} subtitle={`${data.statusBreakdown.approved} claims`} icon={DollarSign} color="bg-blue-100 text-blue-600" />
        <StatCard title="Total Paid Out" value={formatCurrency(data.totalPaidAmount)} subtitle={`${data.statusBreakdown.paid} claims`} icon={DollarSign} color="bg-green-100 text-brand-green" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 bg-gray-50 rounded-lg">
        <div className="text-center"><p className="text-xs text-gray-600">Submitted</p><p className="text-xl font-bold text-blue-600">{data.statusBreakdown.submitted}</p></div>
        <div className="text-center"><p className="text-xs text-gray-600">Under Review</p><p className="text-xl font-bold text-yellow-600">{data.statusBreakdown.under_review}</p></div>
        <div className="text-center"><p className="text-xs text-gray-600">Approved</p><p className="text-xl font-bold text-green-600">{data.statusBreakdown.approved}</p></div>
        <div className="text-center"><p className="text-xs text-gray-600">Rejected</p><p className="text-xl font-bold text-red-600">{data.statusBreakdown.rejected}</p></div>
        <div className="text-center"><p className="text-xs text-gray-600">Paid</p><p className="text-xl font-bold text-brand-green">{data.statusBreakdown.paid}</p></div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Claims Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-gray-200">
              <tr className="text-gray-600 font-medium">
                <th className="text-left py-2 px-3">Member</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-right py-2 px-3">Approved</th>
                <th className="text-right py-2 px-3">Paid</th>
                <th className="text-left py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3">{c.member || '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[c.status] || ''}`}>
                      {c.status.replace('_', ' ').charAt(0).toUpperCase() + c.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td>{formatCurrency(c.amount_approved || 0)}</td>
                  <td>{c.status === 'paid' ? formatCurrency(c.amount_approved || 0) : '—'}</td>
                  <td>{formatDate(c.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {[...Array(totalPages)].map((_, p) => (
              <button
                key={p + 1}
                onClick={() => setPage(p + 1)}
                className={`px-3 py-1 rounded ${page === p + 1 ? 'bg-brand-green text-white' : 'bg-gray-200'}`}
              >
                {p + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
