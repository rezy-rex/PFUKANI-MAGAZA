import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Phone, Mail, MapPin, Calendar, CreditCard, Heart, Shield } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import {
  getMemberByProfileId,
  getMemberPaymentSummary,
  getMemberBeneficiaryCount,
} from '../../services/memberService'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function MemberProfilePage() {
  const { user } = useAuthStore()
  const [member, setMember] = useState(null)
  const [paymentSummary, setPaymentSummary] = useState(null)
  const [beneficiaryCount, setBeneficiaryCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: err } = await getMemberByProfileId(user.id)
      if (cancelled) return
      if (err || !data) { setError(err ?? 'Could not load your member profile.'); setLoading(false); return }
      setMember(data)

      const [payRes, benRes] = await Promise.all([
        getMemberPaymentSummary(data.id),
        getMemberBeneficiaryCount(data.id),
      ])

      if (!cancelled) {
        setPaymentSummary(payRes.data)
        setBeneficiaryCount(benRes.data ?? 0)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user.id])

  if (loading) {
    return (
      <>
        <Navbar />
        <PageWrapper title="My Profile">
          <div className="max-w-2xl card animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}
          </div>
        </PageWrapper>
      </>
    )
  }

  if (error || !member) {
    return (
      <>
        <Navbar />
        <PageWrapper title="My Profile">
          <div className="card text-center py-16">
            <p className="text-red-600 font-semibold mb-2">Unable to load your profile</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </PageWrapper>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title="My Profile"
        subtitle={`Member since ${formatDate(member.joined_date)}`}
      >
        <div className="max-w-2xl space-y-5">
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
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
                <p className="text-brand-charcoal font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {member.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                <p className="text-brand-charcoal font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {member.email || <span className="text-gray-400 italic text-sm">Not provided</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Date Joined</p>
                <p className="text-brand-charcoal font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> {formatDate(member.joined_date)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
                <p className="text-brand-charcoal font-medium flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" /> {member.physical_address}
                </p>
              </div>
            </div>

            {/* Consent notice */}
            <div className="mt-4 flex items-center gap-2 text-sm bg-green-50 text-brand-green rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 shrink-0" />
              POPIA consent recorded on {formatDate(member.consent_date)}
            </div>
          </div>

          {/* Payment summary */}
          <div className="card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              My Payments
            </h2>
            {!paymentSummary ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total payments made</span>
                  <span className="font-semibold">{paymentSummary.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total amount paid</span>
                  <span className="font-semibold">{formatCurrency(paymentSummary.totalAmount)}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  paymentSummary.paidThisMonth ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <span className="text-sm font-medium">This month's payment</span>
                  <span className={`text-sm font-bold ${paymentSummary.paidThisMonth ? 'text-brand-green' : 'text-red-600'}`}>
                    {paymentSummary.paidThisMonth ? '✓ Paid' : '✗ Not yet paid'}
                  </span>
                </div>
                <Link to="/payments/history/me" className="text-brand-green text-sm font-medium hover:underline block text-center mt-1">
                  View full payment history →
                </Link>
              </div>
            )}
          </div>

          {/* Beneficiaries */}
          <div className="card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-gray-400" />
              My Beneficiaries
            </h2>
            {beneficiaryCount === null ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded" />
            ) : (
              <div>
                <p className="text-3xl font-bold text-brand-charcoal text-center">
                  {beneficiaryCount}<span className="text-gray-400 text-xl">/10</span>
                </p>
                <p className="text-sm text-gray-400 text-center mt-1 mb-3">Active beneficiaries</p>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-brand-green h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(beneficiaryCount / 10) * 100}%` }}
                  />
                </div>
                <Link to="/members/me/beneficiaries" className="text-brand-green text-sm font-medium hover:underline block text-center mt-3">
                  View beneficiaries →
                </Link>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
