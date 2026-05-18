import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileUp, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuthStore } from '../../store/authStore'
import {
  getClaimById,
  getClaimDocumentUrl,
  transitionClaim,
  uploadClaimDocument,
} from '../../services/claimService'
import { claimApprovalSchema, claimRejectionSchema } from '../../utils/validators'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'

const DOCUMENT_TYPES = [
  ['death_certificate', 'Death Certificate'],
  ['member_id', 'Member ID Copy'],
  ['beneficiary_id', 'Beneficiary ID Copy'],
  ['funeral_quotation', 'Funeral Quotation'],
  ['other', 'Other'],
]

export default function ClaimDetailsPage() {
  const { id } = useParams()
  const { user, profile } = useAuthStore()
  const isMemberRole = profile?.role === 'member'
  const canAct = profile?.role === 'admin' || profile?.role === 'executive'

  const [claim, setClaim] = useState(null)
  const [documents, setDocuments] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [documentType, setDocumentType] = useState('death_certificate')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [action, setAction] = useState(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [transitioning, setTransitioning] = useState(false)

  async function refreshClaim() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getClaimById(id)
    if (err) { setError(err); setLoading(false); return }
    setClaim(data.claim)
    setDocuments(data.documents)
    setAuditLog(data.auditLog)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadClaim() {
      setLoading(true)
      setError(null)
      const { data, error: err } = await getClaimById(id)
      if (cancelled) return
      if (err) { setError(err); setLoading(false); return }
      setClaim(data.claim)
      setDocuments(data.documents)
      setAuditLog(data.auditLog)
      setLoading(false)
    }

    loadClaim()
    return () => { cancelled = true }
  }, [id])

  const allowedActions = getAllowedActions(claim?.status, profile?.role)

  const actingUser = {
    id: user.id,
    full_name: profile?.full_name ?? user.email,
    role: profile?.role,
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file) { toast.error('Please choose a document.'); return }

    setUploading(true)
    const { data, error: err } = await uploadClaimDocument(Number(id), file, documentType, actingUser)
    setUploading(false)

    if (err) { toast.error(err); return }
    toast.success('Document uploaded')
    setDocuments((current) => [data, ...current])
    setFile(null)
    event.currentTarget.reset()
  }

  const handleDownload = async (document) => {
    const { data, error: err } = await getClaimDocumentUrl(document.stored_path)
    if (err) { toast.error(err); return }
    window.open(data, '_blank', 'noopener,noreferrer')
  }

  const handleTransition = async () => {
    if (!action || !claim) return

    const payload = {}
    if (action === 'approved') {
      const validation = claimApprovalSchema.safeParse({ amount_approved: Number(amount) })
      if (!validation.success) { toast.error(validation.error.issues[0]?.message ?? 'Approved amount is required.'); return }
      payload.amount_approved = validation.data.amount_approved
    }
    if (action === 'rejected') {
      const validation = claimRejectionSchema.safeParse({ rejection_reason: reason })
      if (!validation.success) { toast.error(validation.error.issues[0]?.message ?? 'A rejection reason is required.'); return }
      payload.rejection_reason = validation.data.rejection_reason
    }

    setTransitioning(true)
    const { data, error: err } = await transitionClaim(claim, documents, action, payload, actingUser)
    setTransitioning(false)

    if (err) { toast.error(err); return }

    toast.success(`Claim marked ${action.replace('_', ' ')}`)
    setClaim({ ...claim, ...data })
    setAction(null)
    setAmount('')
    setReason('')
    await refreshClaim()
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <PageWrapper title="Claim Details">
          <div className="card animate-pulse h-56" />
        </PageWrapper>
      </>
    )
  }

  if (error || !claim) {
    return (
      <>
        <Navbar />
        <PageWrapper>
          <div className="card text-center py-12">
            <p className="text-red-600 mb-4">{error ?? 'Claim not found'}</p>
            <Link to="/claims" className="btn-primary inline-flex"><ArrowLeft className="w-4 h-4" /> Back</Link>
          </div>
        </PageWrapper>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageWrapper
        title={`Claim #${claim.id}`}
        subtitle={`${claim.members?.full_name} · ${claim.members?.member_number}`}
        actions={<Link to="/claims" className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back to Claims</Link>}
      >
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="section-title">Claim Information</h2>
                  <p className="text-sm text-gray-400 mt-1">Submitted {formatDate(claim.submitted_at)}</p>
                </div>
                <StatusBadge status={claim.status} type="claim" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Info label="Member">{claim.members?.full_name}</Info>
                <Info label="Beneficiary">{claim.beneficiaries?.full_name ?? 'Member claim'}</Info>
                <Info label="Approved Amount">{claim.amount_approved ? formatCurrency(claim.amount_approved) : '-'}</Info>
                <Info label="Paid At">{formatDate(claim.paid_at)}</Info>
                <Info label="Notes" className="sm:col-span-2">{claim.notes || '-'}</Info>
                {claim.rejection_reason && <Info label="Rejection Reason" className="sm:col-span-2">{claim.rejection_reason}</Info>}
              </div>
            </div>

            <div className="card">
              <h2 className="section-title mb-4">Documents</h2>
              {canAct && (
                <form onSubmit={handleUpload} className="grid sm:grid-cols-[1fr_1.5fr_auto] gap-3 mb-5">
                  <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="form-input">
                    {DOCUMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="form-input"
                  />
                  <button type="submit" disabled={uploading} className="btn-primary">
                    {uploading ? <><div className="spinner" /> Uploading...</> : <><FileUp className="w-4 h-4" /> Upload</>}
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No documents uploaded yet</p>
                ) : documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{document.file_name}</p>
                      <p className="text-xs text-gray-400">{labelDocumentType(document.document_type)} · {formatDateTime(document.uploaded_at)}</p>
                    </div>
                    {!isMemberRole || profile?.member_id === claim.member_id ? (
                      <button type="button" onClick={() => handleDownload(document)} className="text-brand-green hover:text-green-700">
                        <Download className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {allowedActions.length > 0 && (
              <div className="card">
                <h2 className="section-title mb-4">Actions</h2>
                <div className="space-y-3">
                  {allowedActions.map((nextAction) => (
                    <button key={nextAction} type="button" onClick={() => setAction(nextAction)} className="btn-secondary w-full">
                      <RefreshCw className="w-4 h-4" /> {actionLabel(nextAction)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="section-title mb-4">Status History</h2>
              {auditLog.length === 0 ? (
                <p className="text-sm text-gray-400">No status history yet</p>
              ) : (
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="text-sm border-l-2 border-brand-green pl-3">
                      <p className="text-brand-charcoal">{entry.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{entry.user_name} · {formatDateTime(entry.changed_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>

      {action && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-brand-charcoal mb-2">{actionLabel(action)}</h2>
            <p className="text-sm text-gray-500 mb-4">Confirm this status change for claim #{claim.id}.</p>
            {action === 'approved' && (
              <div className="mb-4">
                <label htmlFor="approved_amount" className="form-label">Approved Amount *</label>
                <input id="approved_amount" type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="form-input" />
              </div>
            )}
            {action === 'rejected' && (
              <div className="mb-4">
                <label htmlFor="rejection_reason" className="form-label">Reason *</label>
                <textarea id="rejection_reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="form-input resize-none" />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setAction(null)} className="btn-secondary" disabled={transitioning}>Cancel</button>
              <button type="button" onClick={handleTransition} className={action === 'rejected' ? 'btn-danger' : 'btn-primary'} disabled={transitioning}>
                {transitioning ? <><div className="spinner" /> Saving...</> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Info({ label, children, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="font-medium text-brand-charcoal whitespace-pre-wrap">{children}</p>
    </div>
  )
}

function getAllowedActions(status, role) {
  if (status === 'submitted' && ['admin', 'executive'].includes(role)) return ['under_review', 'rejected']
  if (status === 'under_review' && role === 'admin') return ['approved', 'rejected']
  if (status === 'approved' && role === 'admin') return ['paid', 'rejected']
  return []
}

function actionLabel(action) {
  return {
    under_review: 'Mark Under Review',
    approved: 'Approve Claim',
    rejected: 'Reject Claim',
    paid: 'Mark as Paid',
  }[action] ?? action
}

function labelDocumentType(type) {
  return DOCUMENT_TYPES.find(([value]) => value === type)?.[1] ?? type
}
