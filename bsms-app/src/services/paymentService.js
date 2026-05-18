import { supabase } from '../lib/supabase'
import { logAudit } from './auditService'
import { format } from 'date-fns'

const TABLE = 'payments'

function wrap(data, error) {
  return { data: error ? null : data, error: error ? (error.message ?? 'An error occurred') : null }
}

async function attachRecorderProfiles(payments = []) {
  const recorderIds = [...new Set(payments.map((payment) => payment.recorded_by).filter(Boolean))]
  if (recorderIds.length === 0) return payments

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', recorderIds)

  if (error) throw error

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  return payments.map((payment) => ({
    ...payment,
    recorded_by_profile: profileById.get(payment.recorded_by) ?? null,
  }))
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Returns all payments for a specific member, newest first.
 * Includes profile lookup to get the name of who recorded each payment.
 */
export async function getMemberPayments(memberId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .order('month_year', { ascending: false })

    if (error) throw error
    const payments = await attachRecorderProfiles(data ?? [])
    return wrap(payments, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Returns payments for the currently logged-in Member role user.
 * Uses the profile's member_id — never a URL parameter — so the user
 * cannot manipulate the request to view another member's payments.
 */
export async function getMyPayments(profileId) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('member_id, members(full_name, member_number)')
      .eq('id', profileId)
      .single()

    if (profileError) throw profileError
    if (!profile?.member_id) {
      return { data: null, error: 'No member record linked to your account.' }
    }

    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', profile.member_id)
      .order('month_year', { ascending: false })

    if (payError) throw payError
    const paymentsWithProfiles = await attachRecorderProfiles(payments ?? [])
    return wrap({ payments: paymentsWithProfiles, member: profile.members, memberId: profile.member_id }, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Returns all active members who have NOT paid for the current month.
 * Sorted by the number of consecutive months outstanding (highest first).
 */
export async function getOverdueMembers() {
  try {
    const currentMonth = format(new Date(), 'yyyy-MM')

    // Get IDs of members who HAVE paid this month
    const { data: paid, error: paidError } = await supabase
      .from('payments')
      .select('member_id')
      .eq('month_year', currentMonth)

    if (paidError) throw paidError
    const paidIds = paid.map((p) => p.member_id)

    // Get all active members
    let query = supabase
      .from('members')
      .select('id, member_number, full_name, phone, email, status')
      .eq('status', 'active')
      .order('full_name')

    if (paidIds.length > 0) {
      query = query.not('id', 'in', `(${paidIds.join(',')})`)
    }

    const { data: overdue, error: overdueError } = await query
    if (overdueError) throw overdueError

    // For each overdue member, calculate consecutive months unpaid
    const withCounts = await Promise.all(
      (overdue ?? []).map(async (member) => {
        const { count } = await supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', member.id)

        // Simple consecutive months: check last 12 months backwards
        let consecutiveUnpaid = 0
        const now = new Date()
        for (let i = 0; i < 12; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthStr = format(d, 'yyyy-MM')
          const { data: p } = await supabase
            .from('payments')
            .select('id')
            .eq('member_id', member.id)
            .eq('month_year', monthStr)
            .maybeSingle()
          if (p) break
          consecutiveUnpaid++
        }

        return { ...member, totalPayments: count ?? 0, monthsOutstanding: consecutiveUnpaid }
      })
    )

    // Sort by most months outstanding first
    withCounts.sort((a, b) => b.monthsOutstanding - a.monthsOutstanding)
    return wrap(withCounts, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Checks whether a payment already exists for a given member + month.
 * Returns { data: { exists, existingPayment } }.
 */
export async function checkDuplicatePayment(memberId, monthYear) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, receipt_number, paid_at')
      .eq('member_id', memberId)
      .eq('month_year', monthYear)
      .maybeSingle()

    if (error) throw error
    return wrap({ exists: !!data, existingPayment: data }, null)
  } catch (err) {
    return wrap(null, err)
  }
}

/**
 * Returns quick stats for the current month — used by dashboards.
 */
export async function getCurrentMonthStats() {
  try {
    const currentMonth = format(new Date(), 'yyyy-MM')
    const { data, error, count } = await supabase
      .from('payments')
      .select('amount', { count: 'exact' })
      .eq('month_year', currentMonth)

    if (error) throw error
    const totalAmount = (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
    return wrap({ count: count ?? 0, totalAmount }, null)
  } catch (err) {
    return wrap(null, err)
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Records a new payment.
 * Calls generate_receipt_number() DB function, inserts the payment row,
 * and writes an audit log entry.
 *
 * @param {Object} formData   - { member_id, amount, month_year, notes }
 * @param {Object} member     - { full_name, member_number } for display/audit
 * @param {Object} actingUser - { id, full_name }
 */
export async function recordPayment(formData, member, actingUser) {
  try {
    // Generate receipt number via DB function
    const { data: receiptNumber, error: genError } = await supabase
      .rpc('generate_receipt_number')

    if (genError) throw genError

    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        member_id: formData.member_id,
        amount: formData.amount,
        month_year: formData.month_year,
        receipt_number: receiptNumber,
        recorded_by: actingUser.id,
        notes: formData.notes || null,
      })
      .select()
      .single()

    if (insertError) throw insertError

    await logAudit({
      tableName: TABLE,
      operation: 'CREATE',
      recordId: payment.id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Payment of R${formData.amount} recorded for ${member.full_name} (${member.member_number}) — ${formData.month_year}. Receipt: ${receiptNumber}`,
      newValue: receiptNumber,
    })

    return wrap({ ...payment, receipt_number: receiptNumber }, null)
  } catch (err) {
    return wrap(null, err)
  }
}
