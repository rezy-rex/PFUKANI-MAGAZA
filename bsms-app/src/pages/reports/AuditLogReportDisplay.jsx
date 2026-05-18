import { useState } from 'react'
import { formatDateTime } from '../../utils/formatters'

const ITEMS_PER_PAGE = 20

export default function AuditLogReportDisplay({ data }) {
  const [page, setPage] = useState(1)

  const start = (page - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const entries = data.entries.slice(start, end)
  const totalPages = Math.ceil(data.entries.length / ITEMS_PER_PAGE)

  const operationColors = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    STATUS_CHANGE: 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Audit Log Entries ({data.entries.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-gray-200">
              <tr className="text-gray-600 font-medium">
                <th className="text-left py-2 px-3">User</th>
                <th className="text-left py-2 px-3">Operation</th>
                <th className="text-left py-2 px-3">Table</th>
                <th className="text-left py-2 px-3">Description</th>
                <th className="text-left py-2 px-3">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-brand-charcoal">{e.user_name}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${operationColors[e.operation] || 'bg-gray-100'}`}>
                      {e.operation.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{e.table_name}</td>
                  <td className="py-3 px-3 text-gray-600">{e.description || '—'}</td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{formatDateTime(e.changed_at)}</td>
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
