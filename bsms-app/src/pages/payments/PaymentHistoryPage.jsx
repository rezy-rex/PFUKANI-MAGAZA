import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, CreditCard, CheckCircle, XCircle } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import { getMemberPayments, getMyPayments } from '../../services/paymentService'
import { getMemberById } from '../../services/memberService'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatCurrency, formatMonthYear } from '../../utils/formatters'
import { generateAndDownloadReceipt } from '../../utils/generateReceipt'
import { format } from 'date-fns'

export default function PaymentHistoryPage() {
  const { memberId } = useParams()       // 'me' for member-role, or a numeric id for staff
  const { user, profile } = useAuthStore()
  const isMemberRole = profile?.role === 'member'
  const isAdmin = profile?.role === 'admin'
  const isExecutive = profile?.role === 'executive'

  const [payments, setPayments] = useState([])
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentMonth = format(new Date(), 'yyyy-MM')
  const paidThisMonth = payments.some((p) => p.month_year === currentMonth)
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)

      if (memberId === 'me' || isMemberRole) {
        // Member-role: use profile-based fetch (safe from URL manipulation)
        const { data, error: err } = await getMyPayments(user.id)
        if (cancelled) return
        if (err) { setError(err); setLoading(false); return }
        setPayments(data?.payments ?? [])
        setMember(data?.member ?? null)
      } else {
        // Staff: fetch by URL member id
        const [payRes, memberRes] = await Promise.all([
          getMemberPayments(memberId),
          getMemberById(memberId),
        ])
        if (cancelled) return
        if (payRes.error) { setError(payRes.error); setLoading(false); return }
        setPayments(payRes.data ?? [])
        setMember(memberRes.data ?? null)
      }

      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [memberId, user.id, isMemberRole])

  const handleDownload = (payment) => {
    if (!member) return
    generateAndDownloadReceipt(
      payment,
      { full_name: member.full_name, member_number: member.member_number },
      payment.recorded_by_profile?.full_name ?? 'Staff'
    )
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title="Payment History"
        subtitle={member ? `${member.full_name} · ${member.member_number}` : 'Loading...'}
        actions={
          <div className="flex gap-3 flex-wrap">
            {(isAdmin || isExecutive) && member && (
              <Link
                to={`/payments/record`}
                className="btn-primary"
              >
                <CreditCard className="w-4 h-4" /> Record Payment
              </Link>
            )}
            {!isMemberRole && (
              <Link to={`/members/${memberId}`} className="btn-secondary">
                <ArrowLeft className="w-4 h-4" /> Back to Member
              </Link>
            )}
          </div>
        }
      >
        {/* Summary strip */}
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div className="card text-center">
            <p className="text-2xl font-bold text-brand-charcoal">{loading ? '—' : payments.length}</p>
            <p className="text-sm text-gray-400 mt-1">Total Payments</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-brand-charcoal">{loading ? '—' : formatCurrency(totalAmount)}</p>
            <p className="text-sm text-gray-400 mt-1">Total Paid</p>
          </div>
          <div className={`card text-center ${!loading && (paidThisMonth ? 'bg-green-50' : 'bg-red-50')}`}>
            {loading ? (
              <div className="animate-pulse h-7 bg-gray-200 rounded w-16 mx-auto mb-2" />
            ) : paidThisMonth ? (
              <>
                <CheckCircle className="w-7 h-7 text-brand-green mx-auto" />
                <p className="text-sm text-brand-green font-semibold mt-1">Paid This Month</p>
              </>
            ) : (
              <>
                <XCircle className="w-7 h-7 text-red-500 mx-auto" />
                <p className="text-sm text-red-600 font-semibold mt-1">Not Paid This Month</p>
              </>
            )}
          </div>
        </div>

        {/* Payments table */}
        <div className="card p-0 overflow-hidden">
          {error && <div className="p-6 text-center text-red-600 text-sm">{error}</div>}

          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">Month</th>
                    <th className="table-header text-left">Amount</th>
                    <th className="table-header text-left hidden sm:table-cell">Receipt #</th>
                    <th className="table-header text-left hidden md:table-cell">Date Paid</th>
                    <th className="table-header text-left hidden lg:table-cell">Recorded By</th>
                    <th className="table-header text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                          <td className="table-cell hidden sm:table-cell"><div className="h-3 bg-gray-200 rounded w-32" /></td>
                          <td className="table-cell hidden md:table-cell"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                          <td className="table-cell hidden lg:table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                          <td className="table-cell text-right"><div className="h-6 bg-gray-200 rounded w-16 ml-auto" /></td>
                        </tr>
                      ))
                    : payments.length === 0
                    ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400 font-semibold">No payments recorded yet</p>
                          </td>
                        </tr>
                      )
                    : payments.map((payment) => (
                        <tr key={payment.id} className={payment.month_year === currentMonth ? 'bg-green-50/50' : ''}>
                          <td className="table-cell font-medium">
                            {formatMonthYear(payment.month_year)}
                            {payment.month_year === currentMonth && (
                              <span className="ml-2 text-xs bg-brand-green text-white px-1.5 py-0.5 rounded-full">current</span>
                            )}
                          </td>
                          <td className="table-cell font-semibold text-brand-green">{formatCurrency(payment.amount)}</td>
                          <td className="table-cell hidden sm:table-cell">
                            <span className="font-mono text-xs text-brand-charcoal">{payment.receipt_number}</span>
                          </td>
                          <td className="table-cell hidden md:table-cell text-gray-500">{formatDate(payment.paid_at)}</td>
                          <td className="table-cell hidden lg:table-cell text-gray-500">
                            {payment.recorded_by_profile?.full_name ?? '—'}
                          </td>
                          <td className="table-cell text-right">
                            <button
                              onClick={() => handleDownload(payment)}
                              className="inline-flex items-center gap-1 text-xs text-brand-green hover:text-green-700 font-medium transition-colors"
                              title="Download receipt"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
