import { useState } from 'react'
import StatCard from '../../components/ui/StatCard'
import { Users } from 'lucide-react'
import { formatDate } from '../../utils/formatters'

const ITEMS_PER_PAGE = 20

export default function MemberStatusReportDisplay({ data }) {
  const [page, setPage] = useState(1)

  const start = (page - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const members = data.allMembers.slice(start, end)
  const totalPages = Math.ceil(data.allMembers.length / ITEMS_PER_PAGE)

  const statusColors = {
    active: 'bg-green-100 text-brand-green',
    deceased: 'bg-gray-100 text-gray-600',
    resigned: 'bg-orange-100 text-orange-600',
    suspended: 'bg-red-100 text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Active" value={data.statusBreakdown.active} icon={Users} color="bg-green-100 text-brand-green" />
        <StatCard title="Deceased" value={data.statusBreakdown.deceased} icon={Users} color="bg-gray-100 text-gray-600" />
        <StatCard title="Resigned" value={data.statusBreakdown.resigned} icon={Users} color="bg-orange-100 text-orange-600" />
        <StatCard title="Suspended" value={data.statusBreakdown.suspended} icon={Users} color="bg-red-100 text-red-600" />
        <StatCard title="New This Month" value={data.newMembersThisMonth} icon={Users} color="bg-blue-100 text-blue-600" />
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">All Members ({data.allMembers.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-gray-200">
              <tr className="text-gray-600 font-medium">
                <th className="text-left py-2 px-3">Member #</th>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium">{m.member_number}</td>
                  <td className="py-3 px-3">{m.full_name}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[m.status] || ''}`}>
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{formatDate(m.joined_date)}</td>
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
