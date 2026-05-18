import { supabase } from '../lib/supabase'
import { logAudit } from './auditService'
import { format } from 'date-fns'

const TABLE = 'members'
const PAGE_SIZE = 25

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrap(data, error) {
  return { data: error ? null : data, error: error ? error.message ?? 'An error occurred' : null }
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Returns a paginated, optionally filtered list of members.
 * Used by MemberListPage.
 */
export async function getMembers({ search = '', statusFilter = '', page = 1, pageSize = PAGE_SIZE } = {}) {
  try {
    let query = supabase
      .from('members')
      .select('id, member_number, full_name, phone, status, joined_date, email', { count: 'exact' })
      .order('full_name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search}%,member_number.ilike.%${search}%,id_number.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query
    if (error) throw error

    return { data: { members: data, total: count ?? 0 }, error: null }
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Returns a single member by their integer ID.
 * Used by detail, edit, and status pages.
 */
export async function getMemberById(id) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return wrap(data, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Returns the member record linked to a given profile's member_id.
 * Used by the Member-role dashboard and profile page.
 */
export async function getMemberByProfileId(profileId) {
  try {
    // Get member_id from profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('member_id')
      .eq('id', profileId)
      .single()

    if (profileError) throw profileError
    if (!profile?.member_id) {
      return { data: null, error: 'No member record is linked to your account. Please contact an administrator.' }
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', profile.member_id)
      .single()

    if (memberError) throw memberError
    return wrap(member, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Returns the last N audit log entries for a specific member.
 */
export async function getMemberAuditLog(memberId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('record_id', String(memberId))
      .eq('table_name', TABLE)
      .order('changed_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return wrap(data, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Returns payment summary counts for a member.
 */
export async function getMemberPaymentSummary(memberId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, month_year, paid_at')
      .eq('member_id', memberId)
      .order('month_year', { ascending: false })

    if (error) throw error

    const currentMonth = format(new Date(), 'yyyy-MM')
    const paidThisMonth = data?.some((p) => p.month_year === currentMonth) ?? false
    const totalAmount = data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0

    return wrap({ payments: data, count: data?.length ?? 0, totalAmount, paidThisMonth }, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Returns active beneficiary count for a member.
 */
export async function getMemberBeneficiaryCount(memberId) {
  try {
    const { count, error } = await supabase
      .from('beneficiaries')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('is_active', true)

    if (error) throw error
    return wrap(count ?? 0, null)
  } catch (err) {
    return wrap(null, err)
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Registers a new member.
 * Calls the generate_member_number() DB function, inserts the member row,
 * and writes an audit log entry.
 *
 * @param {Object} formData   - Validated form data from memberSchema
 * @param {Object} actingUser - { id, full_name } of the staff member performing the action
 */
export async function registerMember(formData, actingUser) {
  try {
    // Check for duplicate ID number
    const { data: existing, error: checkError } = await supabase
      .from('members')
      .select('id, id_number')
      .eq('id_number', formData.id_number)
      .maybeSingle()

    if (checkError) throw checkError
    if (existing) {
      return { data: null, error: 'A member with this ID number is already registered.' }
    }

    // Generate member number via DB function
    const { data: memberNumberData, error: genError } = await supabase
      .rpc('generate_member_number')

    if (genError) throw genError

    const memberNumber = memberNumberData

    // Insert the member record
    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert({
        member_number: memberNumber,
        full_name: formData.full_name,
        id_number: formData.id_number,
        phone: formData.phone,
        email: formData.email || null,
        physical_address: formData.physical_address,
        joined_date: formData.joined_date,
        consent_given: formData.consent_given,
        consent_date: formData.consent_given ? new Date().toISOString() : null,
        status: 'active',
        created_by: actingUser.id,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Write audit log
    await logAudit({
      tableName: TABLE,
      operation: 'CREATE',
      recordId: newMember.id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Registered new member ${newMember.full_name} (${memberNumber})`,
      newValue: memberNumber,
    })

    return wrap(newMember, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Updates editable member fields (not ID number, not member number).
 */
export async function updateMember(id, formData, actingUser) {
  try {
    // Get current values for audit comparison
    const { data: current, error: fetchError } = await supabase
      .from('members')
      .select('full_name, phone, email, physical_address, joined_date')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const { data: updated, error: updateError } = await supabase
      .from('members')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || null,
        physical_address: formData.physical_address,
        joined_date: formData.joined_date,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    await logAudit({
      tableName: TABLE,
      operation: 'UPDATE',
      recordId: id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Updated member profile for ${updated.full_name}`,
      previousValue: JSON.stringify({
        full_name: current.full_name,
        phone: current.phone,
        email: current.email,
      }),
      newValue: JSON.stringify({
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
      }),
    })

    return wrap(updated, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Changes a member's status. Admin only — enforced here AND by RLS.
 */
export async function changeMemberStatus(id, newStatus, reason, actingUser) {
  try {
    if (actingUser.role !== 'admin') {
      return { data: null, error: 'Only administrators can change member status.' }
    }

    // Get current status for audit log
    const { data: current, error: fetchError } = await supabase
      .from('members')
      .select('status, full_name, member_number')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (current.status === newStatus) {
      return { data: null, error: `Member is already ${newStatus}.` }
    }

    const { data: updated, error: updateError } = await supabase
      .from('members')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    await logAudit({
      tableName: TABLE,
      operation: 'STATUS_CHANGE',
      recordId: id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Status changed to ${newStatus} for ${current.full_name} (${current.member_number}). Reason: ${reason}`,
      previousValue: current.status,
      newValue: newStatus,
    })

    return wrap(updated, null)
  } catch (err) {
    return wrap(null, err)
  }
}
