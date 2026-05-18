import { useState } from 'react'
import { formatCurrency } from '../../utils/formatters'
import StatCard from '../../components/ui/StatCard'
import { Users, CreditCard, TrendingUp } from 'lucide-react'

const ITEMS_PER_PAGE = 15

export default function MonthlyPaymentReportDisplay({ data }) {
  const [paidPage, setPaidPage] = useState(1)
  const [unpaidPage, setUnpaidPage] = useState(1)

  const paidStart = (paidPage - 1) * ITEMS_PER_PAGE
  const paidEnd = paidStart + ITEMS_PER_PAGE
  const paidMembers = data.paidMembers.slice(paidStart, paidEnd)
  const paidPages = Math.ceil(data.paidMembers.length / ITEMS_PER_PAGE)

  const unpaidStart = (unpaidPage - 1) * ITEMS_PER_PAGE
  const unpaidEnd = unpaidStart + ITEMS_PER_PAGE
  const unpaidMembers = data.unpaidMembers.slice(unpaidStart, unpaidEnd)
  const unpaidPages = Math.ceil(data.unpaidMembers.length / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Active Members" value={data.totalMembers} icon={Users} color="bg-green-100 text-brand-green" />
        <StatCard title="Members Paid" value={data.paidCount} icon={CreditCard} color="bg-blue-100 text-blue-600" />
        <StatCard title="Members Outstanding" value={data.unpaidCount} icon={Users} color="bg-red-100 text-red-600" />
        <StatCard title="Collection Rate" value={`${data.collectionRate.toFixed(1)}%`} subtitle={formatCurrency(data.totalAmount)} icon={TrendingUp} color="bg-yellow-100 text-yellow-600" />
      </div>

      {data.paidMembers.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Members Who Paid ({data.paidCount})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-gray-200">
                <tr className="text-gray-600 font-medium">
                  <th className="text-left py-2 px-3">Member #</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Receipt #</th>
                  <th className="text-right py-2 px-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paidMembers.map((m, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">{m.member_number}</td>
                    <td className="py-3 px-3">{m.full_name}</td>
                    <td className="py-3 px-3">{m.receipt_number}</td>
                    <td className="py-3 px-3 text-right font-medium text-brand-green">{formatCurrency(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paidPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(paidPages)].map((_, p) => (
                <button
                  key={p + 1}
                  onClick={() => setPaidPage(p + 1)}
                  className={`px-3 py-1 rounded ${paidPage === p + 1 ? 'bg-brand-green text-white' : 'bg-gray-200'}`}
                >
                  {p + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {data.unpaidMembers.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Members Outstanding ({data.unpaidCount})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-gray-200">
                <tr className="text-gray-600 font-medium">
                  <th className="text-left py-2 px-3">Member #</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Phone</th>
                </tr>
              </thead>
              <tbody>
                {unpaidMembers.map((m, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">{m.member_number}</td>
                    <td className="py-3 px-3">{m.full_name}</td>
                    <td className="py-3 px-3">{m.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unpaidPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(unpaidPages)].map((_, p) => (
                <button
                  key={p + 1}
                  onClick={() => setUnpaidPage(p + 1)}
                  className={`px-3 py-1 rounded ${unpaidPage === p + 1 ? 'bg-brand-green text-white' : 'bg-gray-200'}`}
                >
                  {p + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
