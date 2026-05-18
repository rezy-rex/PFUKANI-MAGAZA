import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, RefreshCw, User, Phone, Mail, MapPin,
  Calendar, CreditCard, Heart, FileText, Shield, Clock
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import {
  getMemberById,
  getMemberPaymentSummary,
  getMemberBeneficiaryCount,
  getMemberAuditLog,
} from '../../services/memberService'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters'

export default function MemberDetailsPage() {
  const { id } = useParams()
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin'
  const isExecutive = profile?.role === 'executive'

  const [member, setMember] = useState(null)
  const [paymentSummary, setPaymentSummary] = useState(null)
  const [beneficiaryCount, setBeneficiaryCount] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await getMemberById(id)
      if (cancelled) return
      if (err || !data) { setError(err ?? 'Member not found'); setLoading(false); return }

      setMember(data)

      // Load supplementary data in parallel
      const [payRes, benRes, auditRes] = await Promise.all([
        getMemberPaymentSummary(data.id),
        getMemberBeneficiaryCount(data.id),
        isAdmin ? getMemberAuditLog(data.id) : Promise.resolve({ data: [] }),
      ])

      if (!cancelled) {
        setPaymentSummary(payRes.data)
        setBeneficiaryCount(benRes.data ?? 0)
        setAuditLog(auditRes.data ?? [])
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, isAdmin])

  if (loading) return <LoadingSkeleton />

  if (error || !member) {
    return (
      <>
        <Navbar />
        <PageWrapper>
          <div className="card text-center py-16">
            <p className="text-red-600 font-semibold mb-3">Member not found</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <Link to="/members" className="btn-primary inline-flex">
              <ArrowLeft className="w-4 h-4" /> Back to Members
            </Link>
          </div>
        </PageWrapper>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title={member.full_name}
        subtitle={`Member since ${formatDate(member.joined_date)}`}
        actions={
          <div className="flex gap-3 flex-wrap">
            {(isAdmin || isExecutive) && (
              <Link to={`/members/${member.id}/edit`} className="btn-secondary">
                <Edit className="w-4 h-4" /> Edit
              </Link>
            )}
            {isAdmin && (
              <Link to={`/members/${member.id}/status`} className="btn-secondary">
                <RefreshCw className="w-4 h-4" /> Change Status
              </Link>
            )}
            <Link to="/members" className="btn-secondary">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        }
      >
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile card */}
            <div className="card">
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-green/10 rounded-full p-3">
                    <User className="w-7 h-7 text-brand-green" />
                  </div>
                  <div>
                    <h2 className="font-bold text-brand-charcoal text-lg">{member.full_name}</h2>
                    <span className="font-mono text-xs text-brand-green font-semibold bg-green-50 px-2 py-0.5 rounded">
                      {member.member_number}
                    </span>
                  </div>
                </div>
                <StatusBadge status={member.status} type="member" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow icon={Shield} label="SA ID Number">
                  <span className="font-mono">{member.id_number}</span>
                </InfoRow>
                <InfoRow icon={Phone} label="Phone">
                  {member.phone}
                </InfoRow>
                <InfoRow icon={Mail} label="Email">
                  {member.email || <span className="text-gray-400 italic">Not provided</span>}
                </InfoRow>
                <InfoRow icon={Calendar} label="Date Joined">
                  {formatDate(member.joined_date)}
                </InfoRow>
                <InfoRow icon={MapPin} label="Physical Address" className="sm:col-span-2">
                  {member.physical_address}
                </InfoRow>
              </div>

              {/* Consent */}
              <div className={`mt-4 flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                member.consent_given ? 'bg-green-50 text-brand-green' : 'bg-red-50 text-red-600'
              }`}>
                <Shield className="w-4 h-4 shrink-0" />
                {member.consent_given
                  ? `POPIA consent given${member.consent_date ? ` on ${formatDate(member.consent_date)}` : ''}`
                  : 'POPIA consent not recorded'}
              </div>
            </div>

            {/* Audit log (Admin only) */}
            {isAdmin && (
              <div className="card">
                <h2 className="section-title mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Recent Activity
                </h2>
                {auditLog.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No activity recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-brand-green shrink-0 mt-1.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-charcoal">{entry.description}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {entry.user_name} · {formatDateTime(entry.changed_at)}
                          </p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium shrink-0">
                          {entry.operation}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column — summary cards */}
          <div className="space-y-5">
            {/* Payment summary */}
            <div className="card">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                Payment Summary
              </h2>
              {!paymentSummary ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  <SummaryRow
                    label="Total Payments"
                    value={paymentSummary.count}
                  />
                  <SummaryRow
                    label="Total Paid"
                    value={formatCurrency(paymentSummary.totalAmount)}
                  />
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    paymentSummary.paidThisMonth ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <span className="text-sm font-medium">This Month</span>
                    <span className={`text-sm font-bold ${
                      paymentSummary.paidThisMonth ? 'text-brand-green' : 'text-red-600'
                    }`}>
                      {paymentSummary.paidThisMonth ? '✓ Paid' : '✗ Not Paid'}
                    </span>
                  </div>
                  <Link
                    to={`/payments/history/${member.id}`}
                    className="text-brand-green text-sm font-medium hover:underline block text-center mt-2"
                  >
                    View full payment history →
                  </Link>
                </div>
              )}
            </div>

            {/* Beneficiaries */}
            <div className="card">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-gray-400" />
                Beneficiaries
              </h2>
              {beneficiaryCount === null ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded" />
              ) : (
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-charcoal">
                    {beneficiaryCount}<span className="text-gray-400 text-xl">/10</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Active beneficiaries</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
                    <div
                      className="bg-brand-green h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(beneficiaryCount / 10) * 100}%` }}
                    />
                  </div>
                  <Link
                    to={`/members/${member.id}/beneficiaries`}
                    className="text-brand-green text-sm font-medium hover:underline block mt-3"
                  >
                    Manage beneficiaries →
                  </Link>
                </div>
              )}
            </div>

            {/* Claims quick link */}
            <div className="card">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Claims
              </h2>
              <Link
                to={`/claims?memberId=${member.id}`}
                className="text-brand-green text-sm font-medium hover:underline block text-center"
              >
                View member claims →
              </Link>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}

function InfoRow({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-brand-charcoal text-sm font-medium pl-5">{children}</p>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-semibold text-brand-charcoal">{value}</span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <>
      <Navbar />
      <PageWrapper title="Loading...">
        <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="card h-48 bg-gray-100" />
            <div className="card h-32 bg-gray-100" />
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
