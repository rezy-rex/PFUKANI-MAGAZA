import { supabase } from '../lib/supabase'
import { logAudit } from './auditService'

const CLAIMS = 'claims'
const DOCUMENTS = 'claim_documents'
const BUCKET = 'claim-documents'
const ACTIVE_CLAIM_STATUSES = ['submitted', 'under_review', 'approved']
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function wrap(data, error) {
  return { data: error ? null : data, error: error ? (error.message ?? 'An error occurred') : null }
}

function getExtension(fileName = '') {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function validateFile(file) {
  const extension = getExtension(file.name)
  if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Only PDF, JPG, and PNG documents are allowed.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Documents must be 5MB or smaller.'
  }
  return null
}

export async function getClaims({ profile, memberId = null, status = '' } = {}) {
  try {
    let query = supabase
      .from('claims')
      .select('*, members(id, full_name, member_number), beneficiaries(id, full_name, relationship)')
      .order('submitted_at', { ascending: false })

    if (profile?.role === 'member') {
      if (!profile.member_id) return { data: null, error: 'No member record linked to your account.' }
      query = query.eq('member_id', profile.member_id)
    } else if (memberId) {
      query = query.eq('member_id', memberId)
    }

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return wrap(data ?? [], null)
  } catch (err) {
    return wrap(null, err)
  }
}

export async function getClaimById(id) {
  try {
    const { data: claim, error } = await supabase
      .from('claims')
      .select('*, members(id, full_name, member_number, status), beneficiaries(id, full_name, relationship)')
      .eq('id', id)
      .single()

    if (error) throw error

    const [{ data: documents, error: docsError }, { data: auditLog, error: auditError }] = await Promise.all([
      supabase.from(DOCUMENTS).select('*').eq('claim_id', id).order('uploaded_at', { ascending: false }),
      supabase.from('audit_logs').select('*').eq('table_name', CLAIMS).eq('record_id', String(id)).order('changed_at', { ascending: false }),
    ])

    if (docsError) throw docsError
    if (auditError) throw auditError

    return wrap({ claim, documents: documents ?? [], auditLog: auditLog ?? [] }, null)
  } catch (err) {
    return wrap(null, err)
  }
}

export async function submitClaim(formData, member, actingUser) {
  try {
    const { data: claim, error } = await supabase
      .from(CLAIMS)
      .insert({
        member_id: formData.member_id,
        beneficiary_id: formData.claim_for === 'beneficiary' ? formData.beneficiary_id : null,
        submitted_by: actingUser.id,
        notes: [
          formData.notes || null,
          formData.date_of_death ? `Date of death: ${formData.date_of_death}` : null,
        ].filter(Boolean).join('\n') || null,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('members').update({ status: 'deceased' }).eq('id', formData.member_id)

    await logAudit({
      tableName: CLAIMS,
      operation: 'CREATE',
      recordId: claim.id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Submitted claim #${claim.id} for ${member.full_name} (${member.member_number})`,
      newValue: 'submitted',
    })

    await logAudit({
      tableName: 'members',
      operation: 'STATUS_CHANGE',
      recordId: formData.member_id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Member status changed to deceased after claim #${claim.id} submission`,
      newValue: 'deceased',
    })

    return wrap(claim, null)
  } catch (err) {
    return wrap(null, err)
  }
}

export async function uploadClaimDocument(claimId, file, documentType, actingUser) {
  try {
    const fileError = validateFile(file)
    if (fileError) return { data: null, error: fileError }

    const extension = getExtension(file.name)
    const path = `claims/${claimId}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from(DOCUMENTS)
      .insert({
        claim_id: claimId,
        file_name: file.name,
        stored_path: path,
        document_type: documentType,
        uploaded_by: actingUser.id,
      })
      .select()
      .single()

    if (error) throw error

    await logAudit({
      tableName: DOCUMENTS,
      operation: 'CREATE',
      recordId: data.id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Uploaded ${documentType.replaceAll('_', ' ')} for claim #${claimId}`,
      newValue: file.name,
    })

    return wrap(data, null)
  } catch (err) {
    return wrap(null, err)
  }
}

export async function getClaimDocumentUrl(path) {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60)
    if (error) throw error
    return wrap(data.signedUrl, null)
  } catch (err) {
    return wrap(null, err)
  }
}

function nextStatuses(status, role) {
  if (status === 'submitted') return role === 'admin' || role === 'executive' ? ['under_review', 'rejected'] : []
  if (status === 'under_review') return role === 'admin' ? ['approved', 'rejected'] : []
  if (status === 'approved') return role === 'admin' ? ['paid', 'rejected'] : []
  return []
}

export async function transitionClaim(claim, documents, action, payload, actingUser) {
  try {
    const allowed = nextStatuses(claim.status, actingUser.role)
    if (!allowed.includes(action)) return { data: null, error: 'This claim cannot move to that status.' }

    const documentTypes = new Set(documents.map((doc) => doc.document_type))
    if (action === 'under_review' && (!documentTypes.has('death_certificate') || !documentTypes.has('member_id'))) {
      return { data: null, error: 'Death Certificate and Member ID Copy are required before review.' }
    }
    if (action === 'approved' && !documentTypes.has('death_certificate')) {
      return { data: null, error: 'A Death Certificate must be uploaded before approval.' }
    }
    if (action === 'approved' && (!payload.amount_approved || payload.amount_approved <= 0)) {
      return { data: null, error: 'Approved amount is required.' }
    }
    if (action === 'rejected' && !payload.rejection_reason?.trim()) {
      return { data: null, error: 'A rejection reason is required.' }
    }

    const updates = { status: action }
    if (action === 'under_review') {
      updates.reviewed_by = actingUser.id
      updates.reviewed_at = new Date().toISOString()
    }
    if (action === 'approved') {
      updates.approved_by = actingUser.id
      updates.approved_at = new Date().toISOString()
      updates.amount_approved = payload.amount_approved
    }
    if (action === 'paid') updates.paid_at = new Date().toISOString()
    if (action === 'rejected') updates.rejection_reason = payload.rejection_reason

    const { data, error } = await supabase
      .from(CLAIMS)
      .update(updates)
      .eq('id', claim.id)
      .select()
      .single()

    if (error) throw error

    await logAudit({
      tableName: CLAIMS,
      operation: 'STATUS_CHANGE',
      recordId: claim.id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Claim #${claim.id} changed from ${claim.status} to ${action}`,
      previousValue: claim.status,
      newValue: action,
    })

    return wrap(data, null)
  } catch (err) {
    return wrap(null, err)
  }
}

export { ACTIVE_CLAIM_STATUSES }
