import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, subMonths } from 'date-fns'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import MemberSearchInput from '../../components/ui/MemberSearchInput'
import { recordPayment, checkDuplicatePayment } from '../../services/paymentService'
import { getMemberById } from '../../services/memberService'
import { useAuthStore } from '../../store/authStore'
import { formatMonthYear, formatCurrency } from '../../utils/formatters'
import { generateAndDownloadReceipt } from '../../utils/generateReceipt'
import { paymentSchema } from '../../utils/validators'

// Build a list of months: 12 past + current + 1 future
function buildMonthOptions() {
  const now = new Date()
  const months = []
  for (let i = 12; i >= -1; i--) {
    const d = subMonths(now, i)
    months.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy'),
    })
  }
  return months
}

const MONTH_OPTIONS = buildMonthOptions()
const CURRENT_MONTH = format(new Date(), 'yyyy-MM')

export default function RecordPaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuthStore()

  const [selectedMember, setSelectedMember] = useState(null)
  const [memberError, setMemberError] = useState('')
  const [amount, setAmount] = useState('200')
  const [monthYear, setMonthYear] = useState(CURRENT_MONTH)
  const [notes, setNotes] = useState('')
  const [duplicate, setDuplicate] = useState(null) // null | { receipt_number, paid_at }
  const [submitting, setSubmitting] = useState(false)
  const [preselecting, setPreselecting] = useState(false)
  const [savedPayment, setSavedPayment] = useState(null) // payment just recorded

  const handleMemberSelect = useCallback(async (member) => {
    setMemberError('')
    setDuplicate(null)
    setSavedPayment(null)

    // Block deceased / resigned
    if (['deceased', 'resigned'].includes(member.status)) {
      setMemberError(`Cannot record a payment for a ${member.status} member.`)
      return
    }

    setSelectedMember(member)

    // Check for duplicate
    const { data: dupData } = await checkDuplicatePayment(member.id, monthYear)
    if (dupData?.exists) {
      setDuplicate(dupData.existingPayment)
    }
  }, [monthYear])

  useEffect(() => {
    const preselectedMemberId = searchParams.get('memberId') ?? location.state?.preselectedMemberId
    if (!preselectedMemberId || selectedMember) return

    let cancelled = false

    async function loadPreselectedMember() {
      setPreselecting(true)
      const { data, error } = await getMemberById(preselectedMemberId)
      if (cancelled) return

      setPreselecting(false)
      if (error || !data) {
        toast.error(error ?? 'Could not load the selected member.')
        return
      }

      await handleMemberSelect(data)
    }

    loadPreselectedMember()
    return () => { cancelled = true }
  }, [handleMemberSelect, location.state, searchParams, selectedMember])

  const handleMonthChange = async (newMonth) => {
    setMonthYear(newMonth)
    setDuplicate(null)
    if (selectedMember) {
      const { data: dupData } = await checkDuplicatePayment(selectedMember.id, newMonth)
      if (dupData?.exists) setDuplicate(dupData.existingPayment)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedMember) { setMemberError('Please select a member.'); return }
    if (['deceased', 'resigned'].includes(selectedMember.status)) {
      setMemberError(`Cannot record payment for a ${selectedMember.status} member.`)
      return
    }
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Amount must be greater than zero.')
      return
    }

    const validation = paymentSchema.safeParse({
      member_id: selectedMember.id,
      amount: parsedAmount,
      month_year: monthYear,
      notes,
    })
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? 'Please check the payment details.')
      return
    }

    if (duplicate && !notes.trim()) {
      toast.error('A note is required when recording an additional payment for the same month.')
      return
    }

    setSubmitting(true)
    const actingUser = { id: user.id, full_name: profile?.full_name ?? user.email }

    const { data: payment, error } = await recordPayment(
      { member_id: selectedMember.id, amount: parsedAmount, month_year: monthYear, notes },
      selectedMember,
      actingUser
    )
    setSubmitting(false)

    if (error) { toast.error(error); return }

    toast.success(`Payment recorded! Receipt: ${payment.receipt_number}`)
    setSavedPayment(payment)
  }

  useEffect(() => {
    if (!savedPayment?.member_id) return

    const timer = setTimeout(() => {
      navigate(`/payments/history/${savedPayment.member_id}`, { replace: true })
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate, savedPayment])

  const handleDownloadReceipt = () => {
    if (!savedPayment || !selectedMember) return
    generateAndDownloadReceipt(
      savedPayment,
      selectedMember,
      profile?.full_name ?? 'Staff'
    )
  }

  // ── Post-save success screen ──────────────────────────────────────────────
  if (savedPayment && selectedMember) {
    return (
      <>
        <Navbar />
        <PageWrapper title="Payment Recorded" subtitle="The payment has been saved successfully.">
          <div className="max-w-md">
            <div className="card text-center py-8 mb-5">
              <div className="bg-green-100 rounded-full p-4 inline-flex mb-4">
                <CheckCircle className="w-10 h-10 text-brand-green" />
              </div>
              <h2 className="text-xl font-bold text-brand-charcoal mb-1">{selectedMember.full_name}</h2>
              <p className="text-gray-400 text-sm font-mono mb-4">{selectedMember.member_number}</p>
              <div className="bg-brand-grey rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Month</span>
                  <span className="font-semibold">{formatMonthYear(savedPayment.month_year)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-brand-green text-lg">{formatCurrency(savedPayment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Receipt #</span>
                  <span className="font-mono font-semibold">{savedPayment.receipt_number}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleDownloadReceipt} className="btn-primary w-full">
                  <Download className="w-4 h-4" />
                  Download Receipt PDF
                </button>
                <Link to={`/payments/history/${selectedMember.id}`} className="btn-secondary w-full justify-center">
                  View Payment History
                </Link>
                <button
                  onClick={() => {
                    setSavedPayment(null)
                    setSelectedMember(null)
                    setDuplicate(null)
                    setNotes('')
                    setAmount('200')
                    setMonthYear(CURRENT_MONTH)
                  }}
                  className="text-brand-green text-sm font-medium hover:underline"
                >
                  Record Another Payment
                </button>
              </div>
            </div>
          </div>
        </PageWrapper>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title="Record Payment"
        subtitle="Record a monthly contribution payment"
        actions={
          <Link to="/members" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back to Members
          </Link>
        }
      >
        <div className="max-w-lg">
          <form onSubmit={handleSubmit} noValidate>
            {/* Member selection */}
            <div className="card mb-5">
              <h2 className="section-title mb-4">Member</h2>
              <label className="form-label">Search Member *</label>
              <MemberSearchInput
                onSelect={handleMemberSelect}
                onClear={() => { setSelectedMember(null); setDuplicate(null); setMemberError('') }}
                error={memberError}
                disabled={submitting || preselecting}
                placeholder={preselecting ? 'Loading selected member...' : 'Search by name or member number...'}
              />

              {/* Duplicate warning */}
              {duplicate && selectedMember && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    A payment for <strong>{formatMonthYear(monthYear)}</strong> is already recorded for this member
                    (Receipt <span className="font-mono">{duplicate.receipt_number}</span>).
                    You may still record an additional payment — a note will be required.
                  </p>
                </div>
              )}
            </div>

            {/* Payment details */}
            <div className="card mb-5">
              <h2 className="section-title mb-4">Payment Details</h2>
              <div className="space-y-4">
                {/* Month */}
                <div>
                  <label htmlFor="month_year" className="form-label">Month / Year *</label>
                  <select
                    id="month_year"
                    value={monthYear}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="form-input"
                    disabled={submitting}
                  >
                    {MONTH_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}{value === CURRENT_MONTH ? ' (current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="form-label">Amount (R) *</label>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input"
                    disabled={submitting}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="form-label">
                    Notes{duplicate ? ' *' : ' '}
                    {!duplicate && <span className="text-gray-400 font-normal">(optional)</span>}
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="form-input resize-none"
                    placeholder={duplicate ? 'Required — explain why this is an additional payment' : 'Any notes about this payment...'}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={submitting || !!memberError} className="btn-primary">
                {submitting ? (
                  <><div className="spinner" /> Recording...</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> Record Payment</>
                )}
              </button>
              <Link to="/members" className="btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </PageWrapper>
    </>
  )
}
