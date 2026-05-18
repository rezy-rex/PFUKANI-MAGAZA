import { useState, useEffect } from 'react'
import { Users, CreditCard, FileText } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatCard from '../../components/ui/StatCard'
import { useAuthStore } from '../../store/authStore'
import { getCurrentMonthStats, getOverdueMembers } from '../../services/paymentService'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../utils/formatters'

export default function ExecutiveDashboard() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState({ members: null, payments: null, claims: null })
  const [overdueMembers, setOverdueMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      const [
        { count: memberCount },
        paymentStats,
        { count: claimCount },
        overdueData,
      ] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        getCurrentMonthStats(),
        supabase.from('claims').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
        getOverdueMembers(),
      ])
      if (cancelled) return
      setStats({ members: memberCount ?? 0, payments: paymentStats.data, claims: claimCount ?? 0 })
      setOverdueMembers((overdueData.data ?? []).slice(0, 10))
      setLoading(false)
    }
    loadStats()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <Navbar />
      <PageWrapper
        title={`Good day, ${profile?.full_name?.split(' ')[0] ?? 'Executive'}`}
        subtitle="Staff portal — manage payments, claims and member records."
      >
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          <StatCard
            title="Total Active Members"
            value={loading ? '—' : stats.members}
            subtitle="Registered members"
            icon={Users}
            color="bg-green-100 text-brand-green"
          />
          <StatCard
            title="Payments This Month"
            value={loading ? '—' : stats.payments?.count ?? 0}
            subtitle={loading ? 'Loading...' : formatCurrency(stats.payments?.totalAmount ?? 0)}
            icon={CreditCard}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Claims Pending Review"
            value={loading ? '—' : stats.claims}
            subtitle="Submitted or under review"
            icon={FileText}
            color="bg-yellow-100 text-yellow-600"
          />
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Members Most Behind on Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left rounded-tl-lg">Member #</th>
                  <th className="table-header text-left">Full Name</th>
                  <th className="table-header text-left hidden md:table-cell">Phone</th>
                  <th className="table-header text-left rounded-tr-lg">Months Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                        <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-36" /></td>
                        <td className="table-cell hidden md:table-cell"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                        <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                      </tr>
                    ))
                  : overdueMembers.length === 0
                  ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                          No overdue members this month
                        </td>
                      </tr>
                    )
                  : overdueMembers.map((member) => (
                      <tr key={member.id}>
                        <td className="table-cell font-mono text-xs font-semibold text-brand-green">{member.member_number}</td>
                        <td className="table-cell font-medium">{member.full_name}</td>
                        <td className="table-cell hidden md:table-cell text-gray-500">{member.phone}</td>
                        <td className="table-cell font-semibold">{member.monthsOutstanding}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
