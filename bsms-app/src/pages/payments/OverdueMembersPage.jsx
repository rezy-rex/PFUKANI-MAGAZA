import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingDown, CreditCard, Phone, Mail } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import { getOverdueMembers } from '../../services/paymentService'
import { format } from 'date-fns'

const CURRENT_MONTH_LABEL = format(new Date(), 'MMMM yyyy')

export default function OverdueMembersPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: err } = await getOverdueMembers()
      if (cancelled) return
      if (err) { setError(err); setLoading(false); return }
      setMembers(data ?? [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <Navbar />
      <PageWrapper
        title="Overdue Members"
        subtitle={`Active members with no payment recorded for ${CURRENT_MONTH_LABEL}`}
      >
        <div className="card p-0 overflow-hidden">
          {error && (
            <div className="p-6 text-center text-red-600 text-sm">{error}</div>
          )}

          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">Member #</th>
                    <th className="table-header text-left">Full Name</th>
                    <th className="table-header text-left hidden md:table-cell">Phone</th>
                    <th className="table-header text-left hidden lg:table-cell">Email</th>
                    <th className="table-header text-center">Months Outstanding</th>
                    <th className="table-header text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-40" /></td>
                          <td className="table-cell hidden md:table-cell"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                          <td className="table-cell hidden lg:table-cell"><div className="h-3 bg-gray-200 rounded w-36" /></td>
                          <td className="table-cell"><div className="h-5 bg-gray-200 rounded-full w-10 mx-auto" /></td>
                          <td className="table-cell"><div className="h-6 bg-gray-200 rounded w-20 ml-auto" /></td>
                        </tr>
                      ))
                    : members.length === 0
                    ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <div className="bg-green-100 rounded-full p-5 inline-flex mb-4">
                              <CreditCard className="w-10 h-10 text-brand-green" />
                            </div>
                            <p className="font-semibold text-brand-charcoal text-lg mb-2">
                              All caught up! 🎉
                            </p>
                            <p className="text-gray-400 text-sm">
                              All active members have paid for {CURRENT_MONTH_LABEL}.
                            </p>
                          </td>
                        </tr>
                      )
                    : members.map((member) => (
                        <tr key={member.id} className="hover:bg-red-50/40 transition-colors">
                          <td className="table-cell font-mono text-xs font-semibold text-brand-green">
                            {member.member_number}
                          </td>
                          <td className="table-cell font-medium">{member.full_name}</td>
                          <td className="table-cell hidden md:table-cell">
                            <a
                              href={`tel:${member.phone}`}
                              className="flex items-center gap-1 text-gray-500 hover:text-brand-green transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {member.phone}
                            </a>
                          </td>
                          <td className="table-cell hidden lg:table-cell">
                            {member.email ? (
                              <a
                                href={`mailto:${member.email}`}
                                className="flex items-center gap-1 text-gray-500 hover:text-brand-green transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                {member.email}
                              </a>
                            ) : (
                              <span className="text-gray-300 italic text-xs">No email</span>
                            )}
                          </td>
                          <td className="table-cell text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                              member.monthsOutstanding >= 3
                                ? 'bg-red-100 text-red-700'
                                : member.monthsOutstanding >= 2
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {member.monthsOutstanding}
                            </span>
                          </td>
                          <td className="table-cell text-right">
                            <Link
                              to={`/payments/record?memberId=${member.id}`}
                              className="inline-flex items-center gap-1.5 text-xs bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Record
                            </Link>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}

          {/* Summary footer */}
          {!loading && !error && members.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 bg-red-50 flex items-center gap-3">
              <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                {members.length} active member{members.length !== 1 ? 's' : ''} have not paid for {CURRENT_MONTH_LABEL}
              </p>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
