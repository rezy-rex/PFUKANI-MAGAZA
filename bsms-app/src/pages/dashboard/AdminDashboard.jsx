import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, CreditCard, FileText, TrendingDown, UserPlus, PlusCircle, ClipboardList, BarChart2 } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatCard from '../../components/ui/StatCard'
import { useAuthStore } from '../../store/authStore'
import { getCurrentMonthStats, getOverdueMembers } from '../../services/paymentService'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

const QUICK_ACTIONS = [
  { to: '/members/register', label: 'Register Member', icon: UserPlus, color: 'bg-brand-green' },
  { to: '/payments/record', label: 'Record Payment', icon: PlusCircle, color: 'bg-blue-600' },
  { to: '/claims/submit', label: 'Submit Claim', icon: ClipboardList, color: 'bg-yellow-600' },
  { to: '/reports', label: 'Generate Report', icon: BarChart2, color: 'bg-purple-600' },
]

export default function AdminDashboard() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState({ members: null, payments: null, claims: null, overdue: null })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      const [
        { count: memberCount },
        paymentStats,
        { count: claimCount },
        overdueData,
        { data: auditLogs }
      ] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        getCurrentMonthStats(),
        supabase.from('claims').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review', 'approved']),
        getOverdueMembers(),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ])
      if (cancelled) return
      setStats({
        members: memberCount ?? 0,
        payments: paymentStats.data,
        claims: claimCount ?? 0,
        overdue: overdueData.data?.length ?? 0,
      })
      setActivities(auditLogs ?? [])
      setLoading(false)
    }
    loadStats()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <Navbar />
      <PageWrapper
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'Admin'}`}
        subtitle="Here's what's happening with your burial society today."
      >
        {/* Stat Cards */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Active Members"
            value={loading ? '—' : stats.members}
            subtitle="Currently active"
            icon={Users}
            color="bg-green-100 text-brand-green"
          />
          <StatCard
            title="Payments This Month"
            value={loading ? '—' : stats.payments?.count ?? 0}
            subtitle={loading ? 'Loading...' : `${formatCurrency(stats.payments?.totalAmount ?? 0)} collected`}
            icon={CreditCard}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Active Claims"
            value={loading ? '—' : stats.claims}
            subtitle="Not yet paid or rejected"
            icon={FileText}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            title="Overdue Members"
            value={loading ? '—' : stats.overdue}
            subtitle="No payment this month"
            icon={TrendingDown}
            color="bg-red-100 text-red-600"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="section-title mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map(({ to, label, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-grey hover:bg-gray-100 transition-all duration-200 text-center group"
                >
                  <div className={`${color} text-white rounded-xl p-3 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-brand-charcoal leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card lg:col-span-2">
            <h2 className="section-title mb-4">Recent Activity</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-brand-green">{activity.operation?.charAt(0) ?? 'A'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-charcoal">
                        <span className="text-brand-green">{activity.user_name}</span> {activity.operation?.toLowerCase().replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{activity.description || activity.table_name}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatDateTime(activity.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
