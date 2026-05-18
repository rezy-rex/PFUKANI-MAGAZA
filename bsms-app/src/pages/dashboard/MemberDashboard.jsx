import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Heart, FileText } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatCard from '../../components/ui/StatCard'
import { useAuthStore } from '../../store/authStore'
import { getMyPayments } from '../../services/paymentService'
import { getMemberBeneficiaryCount } from '../../services/memberService'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, formatMonthYear } from '../../utils/formatters'

export default function MemberDashboard() {
  const { user, profile } = useAuthStore()
  const [payments, setPayments] = useState([])
  const [memberId, setMemberId] = useState(null)
  const [beneficiaryCount, setBeneficiaryCount] = useState(null)
  const [activeClaims, setActiveClaims] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentMonth = format(new Date(), 'yyyy-MM')
  const currentPayment = payments.find((payment) => payment.month_year === currentMonth)
  const paidThisMonth = !!currentPayment

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      const paymentRes = await getMyPayments(user.id)
      if (cancelled) return

      if (paymentRes.error) {
        setError(paymentRes.error)
        setLoading(false)
        return
      }

      const linkedMemberId = paymentRes.data?.memberId
      setPayments(paymentRes.data?.payments ?? [])
      setMemberId(linkedMemberId ?? null)

      if (!linkedMemberId) {
        setLoading(false)
        return
      }

      const [beneficiaryRes, claimsRes] = await Promise.all([
        getMemberBeneficiaryCount(linkedMemberId),
        supabase
          .from('claims')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', linkedMemberId)
          .in('status', ['submitted', 'under_review', 'approved']),
      ])

      if (cancelled) return

      setBeneficiaryCount(beneficiaryRes.data ?? 0)
      setActiveClaims(claimsRes.count ?? 0)
      setLoading(false)
    }

    loadDashboard()
    return () => { cancelled = true }
  }, [user.id])

  return (
    <>
      <Navbar />
      <PageWrapper
        title={`Hello, ${profile?.full_name?.split(' ')[0] ?? 'Member'}`}
        subtitle="Your Pfukani Magaza member account overview."
      >
        {error && (
          <div className="card mb-5 bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          <StatCard
            title="This Month's Payment"
            value={loading ? '...' : paidThisMonth ? formatCurrency(currentPayment.amount) : 'Pending'}
            subtitle={paidThisMonth ? 'Paid this month' : 'Not paid yet'}
            icon={paidThisMonth ? CheckCircle : XCircle}
            color={paidThisMonth ? 'bg-green-100 text-brand-green' : 'bg-red-100 text-red-600'}
          />
          <StatCard
            title="Beneficiaries"
            value={loading ? '...' : beneficiaryCount ?? 0}
            subtitle="Of 10 maximum"
            icon={Heart}
            color="bg-pink-100 text-pink-600"
          />
          <StatCard
            title="Active Claims"
            value={loading ? '...' : activeClaims ?? 0}
            subtitle="Current claim status"
            icon={FileText}
            color="bg-blue-100 text-blue-600"
          />
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Recent Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left rounded-tl-lg">Month</th>
                  <th className="table-header text-left">Amount</th>
                  <th className="table-header text-left">Receipt #</th>
                  <th className="table-header text-left rounded-tr-lg">Date Paid</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                        <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                        <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-32" /></td>
                        <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                      </tr>
                    ))
                  : payments.length === 0
                  ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-sm text-gray-400">
                          No payments recorded yet
                        </td>
                      </tr>
                    )
                  : payments.slice(0, 5).map((payment) => (
                      <tr key={payment.id}>
                        <td className="table-cell font-medium">{formatMonthYear(payment.month_year)}</td>
                        <td className="table-cell font-semibold text-brand-green">{formatCurrency(payment.amount)}</td>
                        <td className="table-cell font-mono text-xs">{payment.receipt_number}</td>
                        <td className="table-cell text-gray-500">{formatDate(payment.paid_at)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {memberId && (
            <Link to="/payments/history/me" className="text-brand-green text-sm font-medium hover:underline block text-center mt-4">
              View full payment history
            </Link>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
