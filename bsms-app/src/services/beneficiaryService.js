import { supabase } from '../lib/supabase'
import { logAudit } from './auditService'

const TABLE = 'beneficiaries'
const MAX_ACTIVE_BENEFICIARIES = 10

function wrap(data, error) {
  return { data: error ? null : data, error: error ? (error.message ?? 'An error occurred') : null }
}

export async function getBeneficiariesByMember(memberId) {
  try {
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('member_id', memberId)
      .order('is_active', { ascending: false })
      .order('full_name', { ascending: true })

    if (error) throw error
    return wrap(data ?? [], null)
  } catch (err) {
    return wrap(null, err)
  }
}

export async function getBeneficiaryById(id) {
  try {
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('*, members(id, full_name, member_number)')
      .eq('id', id)
      .single()

    if (error) throw error
    return wrap(data, null)
  } catch (err) {
    return wrap(null, err)
  }
}

export async function getMyBeneficiaries(profileId) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('member_id, members(id, full_name, member_number)')
      .eq('id', profileId)
      .single()

    if (profileError) throw profileError
    if (!profile?.member_id) {
      return { data: null, error: 'No member record linked to your account.' }
    }

    const { data: beneficiaries, error } = await getBeneficiariesByMember(profile.member_id)
    if (error) return { data: null, error }

    return wrap({
      beneficiaries,
      member: profile.members,
      memberId: profile.member_id,
    }, null)
  } catch (err) {
    return wrap(null, err)
  }
}

async function validateBeneficiaryInsert(memberId, formData, excludedId = null) {
  const { count, error: countError } = await supabase
    .from('beneficiaries')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('is_active', true)

  if (countError) throw countError
  if (excludedId == null && (count ?? 0) >= MAX_ACTIVE_BENEFICIARIES) {
    return 'This member has reached the maximum of 10 active beneficiaries.'
  }

  let duplicateQuery = supabase
    .from('beneficiaries')
    .select('id')
    .eq('member_id', memberId)
    .eq('id_number', formData.id_number)
    .maybeSingle()

  if (excludedId != null) {
    duplicateQuery = duplicateQuery.neq('id', excludedId)
  }

  const { data: duplicate, error: duplicateError } = await duplicateQuery
  if (duplicateError) throw duplicateError
  if (duplicate) {
    return 'This ID number is already used by another beneficiary on this member.'
  }

  return null
}

export async function addBeneficiary(memberId, formData, member, actingUser) {
  try {
    const validationError = await validateBeneficiaryInsert(memberId, formData)
    if (validationError) return { data: null, error: validationError }

    const { data, error } = await supabase
      .from('beneficiaries')
      .insert({
        member_id: memberId,
        full_name: formData.full_name,
        id_number: formData.id_number,
        relationship: formData.relationship,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    await logAudit({
      tableName: TABLE,
      operation: 'CREATE',
      recordId: data.id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Added beneficiary ${data.full_name} for ${member.full_name} (${member.member_number})`,
      newValue: data.full_name,
    })

    return wrap(data, null)
  } catch (err) {
    return wrap(null, err)
  }
}

export async function updateBeneficiary(id, formData, actingUser) {
  try {
    const { data: current, error: currentError } = await supabase
      .from('beneficiaries')
      .select('*, members(full_name, member_number)')
      .eq('id', id)
      .single()

    if (currentError) throw currentError

    const validationError = await validateBeneficiaryInsert(current.member_id, formData, id)
    if (validationError) return { data: null, error: validationError }

    const { data, error } = await supabase
      .from('beneficiaries')
      .update({
        full_name: formData.full_name,
        id_number: formData.id_number,
        relationship: formData.relationship,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await logAudit({
      tableName: TABLE,
      operation: 'UPDATE',
      recordId: id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Updated beneficiary ${data.full_name} for ${current.members.full_name} (${current.members.member_number})`,
      previousValue: current.full_name,
      newValue: data.full_name,
    })

    return wrap(data, null)
  } catch (err) {
    return wrap(null, err)
  }
}

export async function deactivateBeneficiary(id, reason, actingUser) {
  try {
    if (!reason?.trim()) {
      return { data: null, error: 'Please provide a reason for deactivation.' }
    }

    const { data: current, error: currentError } = await supabase
      .from('beneficiaries')
      .select('*, members(full_name, member_number)')
      .eq('id', id)
      .single()

    if (currentError) throw currentError
    if (!current.is_active) return { data: null, error: 'This beneficiary is already inactive.' }

    const { data, error } = await supabase
      .from('beneficiaries')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await logAudit({
      tableName: TABLE,
      operation: 'STATUS_CHANGE',
      recordId: id,
      userId: actingUser.id,
      userName: actingUser.full_name,
      description: `Deactivated beneficiary ${current.full_name} for ${current.members.full_name} (${current.members.member_number}). Reason: ${reason}`,
      previousValue: 'active',
      newValue: 'inactive',
    })

    return wrap(data, null)
  } catch (err) {
    return wrap(null, err)
  }
}
