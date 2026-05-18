import { supabase } from '../lib/supabase'

export async function getMonthlyPaymentReport(month, year) {
  try {
    const monthYear = `${year}-${String(month).padStart(2, '0')}`

    const { data: activeMembers, error: membersError } = await supabase
      .from('members')
      .select('id, member_number, full_name, phone')
      .eq('status', 'active')

    if (membersError) throw membersError

    const totalMembers = activeMembers?.length || 0
    const activeMemberIds = activeMembers?.map(m => m.id) || []

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('member_id, receipt_number, amount, month_year, members(member_number, full_name)')
      .eq('month_year', monthYear)
      .in('member_id', activeMemberIds.length > 0 ? activeMemberIds : [-1])

    if (paymentsError) throw paymentsError

    const paidCount = paymentsData?.length || 0
    const unpaidCount = totalMembers - paidCount
    const totalAmount = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const collectionRate = totalMembers > 0 ? (paidCount / totalMembers) * 100 : 0

    const paidMembers = (paymentsData || []).map(p => ({
      member_number: p.members?.member_number,
      full_name: p.members?.full_name,
      receipt_number: p.receipt_number,
      amount: p.amount,
      month_year: p.month_year
    }))

    const paidMemberIds = paymentsData?.map(p => p.member_id) || []
    const unpaidMembers = (activeMembers || [])
      .filter(m => !paidMemberIds.includes(m.id))
      .map(m => ({
        member_number: m.member_number,
        full_name: m.full_name,
        phone: m.phone
      }))

    return {
      data: {
        totalMembers,
        paidCount,
        unpaidCount,
        collectionRate,
        totalAmount,
        paidMembers,
        unpaidMembers
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: error.message || 'Failed to generate monthly payment report'
    }
  }
}

export async function getMemberStatusReport() {
  try {
    // joined_date is the correct column — not created_at
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('id, member_number, full_name, status, joined_date, phone')
      .order('joined_date', { ascending: false })

    if (membersError) throw membersError

    const statusBreakdown = {
      active: 0,
      deceased: 0,
      resigned: 0,
      suspended: 0,
      inactive: 0
    }

      ; (allMembers || []).forEach(member => {
        if (statusBreakdown.hasOwnProperty(member.status)) {
          statusBreakdown[member.status]++
        }
      })

    // Use joined_date for new members this month
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const newMembersThisMonth = (allMembers || []).filter(member => {
      const joinedDate = new Date(member.joined_date)
      return joinedDate >= currentMonthStart
    }).length

    const formattedMembers = (allMembers || []).map(m => ({
      member_number: m.member_number,
      full_name: m.full_name,
      status: m.status,
      joined_date: m.joined_date,
      phone: m.phone
    }))

    return {
      data: {
        statusBreakdown,
        newMembersThisMonth,
        allMembers: formattedMembers
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: error.message || 'Failed to generate member status report'
    }
  }
}

export async function getClaimsSummaryReport(fromDate, toDate) {
  try {
    // Fixed: amount_approved not approved_amount, submitted_at not created_at
    // paid_amount does not exist — paid status means amount_approved was paid
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select('id, member_id, status, amount_approved, submitted_at, paid_at, members(full_name)')
      .gte('submitted_at', fromDate)
      .lte('submitted_at', toDate + 'T23:59:59')
      .order('submitted_at', { ascending: false })

    if (claimsError) throw claimsError

    const statusBreakdown = {
      submitted: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      paid: 0
    }

    let totalApprovedAmount = 0
    let totalPaidAmount = 0

      ; (claims || []).forEach(claim => {
        if (statusBreakdown.hasOwnProperty(claim.status)) {
          statusBreakdown[claim.status]++
        }
        if (['approved', 'paid'].includes(claim.status) && claim.amount_approved) {
          totalApprovedAmount += claim.amount_approved
        }
        if (claim.status === 'paid' && claim.amount_approved) {
          totalPaidAmount += claim.amount_approved
        }
      })

    const formattedClaims = (claims || []).map(c => ({
      claim_id: c.id,
      member: c.members?.full_name,
      status: c.status,
      amount_approved: c.amount_approved,
      submitted_at: c.submitted_at,
      paid_at: c.paid_at
    }))

    return {
      data: {
        totalClaims: claims?.length || 0,
        statusBreakdown,
        totalApprovedAmount,
        totalPaidAmount,
        claims: formattedClaims
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: error.message || 'Failed to generate claims summary report'
    }
  }
}

export async function getAuditLogReport(fromDate, toDate, userFilter = null) {
  try {
    // Fixed: changed_at not created_at
    let query = supabase
      .from('audit_logs')
      .select('user_name, operation, table_name, description, changed_at, record_id')
      .gte('changed_at', fromDate)
      .lte('changed_at', toDate + 'T23:59:59')

    if (userFilter && userFilter.trim()) {
      query = query.ilike('user_name', `%${userFilter}%`)
    }

    const { data: entries, error: logsError } = await query
      .order('changed_at', { ascending: false })

    if (logsError) throw logsError

    return {
      data: {
        entries: entries || []
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: error.message || 'Failed to generate audit log report'
    }
  }
}