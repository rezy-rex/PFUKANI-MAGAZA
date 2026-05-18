import { z } from 'zod'

// ── Shared field rules ────────────────────────────────────────────────────────

const saIdNumber = z
  .string()
  .min(1, 'ID number is required')
  .regex(/^\d{13}$/, 'SA ID number must be exactly 13 digits')

const phoneNumber = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^[0-9+\s\-()]{7,15}$/, 'Enter a valid phone number')

// ── Member registration schema ────────────────────────────────────────────────

export const memberSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long'),
  id_number: saIdNumber,
  phone: phoneNumber,
  email: z
    .string()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  physical_address: z
    .string()
    .min(5, 'Physical address is required')
    .max(255, 'Address is too long'),
  joined_date: z
    .string()
    .min(1, 'Date joined is required'),
  consent_given: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Member consent is required before registration',
    }),
})

// ── Member edit schema (no ID number — it is read-only) ──────────────────────

export const memberEditSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long'),
  phone: phoneNumber,
  email: z
    .string()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  physical_address: z
    .string()
    .min(5, 'Physical address is required')
    .max(255, 'Address is too long'),
  joined_date: z
    .string()
    .min(1, 'Date joined is required'),
})

// ── Status change schema ──────────────────────────────────────────────────────

const MEMBER_STATUSES = ['active', 'suspended', 'deceased', 'resigned', 'inactive']

export const statusChangeSchema = z.object({
  new_status: z
    .string()
    .refine((val) => MEMBER_STATUSES.includes(val), {
      message: 'Please select a valid status',
    }),
  reason: z
    .string()
    .min(5, 'Please provide a reason (at least 5 characters)')
    .max(500, 'Reason is too long'),
})

// ── Payment schema ────────────────────────────────────────────────────────────

export const paymentSchema = z.object({
  member_id: z
    .number({ required_error: 'Please select a member' })
    .int()
    .positive('Please select a member'),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than zero')
    .max(99999, 'Amount seems too large'),
  month_year: z
    .string()
    .min(1, 'Month / year is required')
    .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  notes: z
    .string()
    .max(500, 'Notes are too long')
    .optional()
    .or(z.literal('')),
})

// Beneficiary schema

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other']

export const beneficiarySchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long'),
  id_number: saIdNumber,
  relationship: z
    .string()
    .refine((value) => RELATIONSHIPS.includes(value), {
      message: 'Please select a valid relationship',
    }),
  phone: z
    .string()
    .regex(/^[0-9+\s\-()]{7,15}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required'),
})

export const claimSubmitSchema = z.object({
  member_id: z
    .number({ required_error: 'Please select a member' })
    .int()
    .positive('Please select a member'),
  claim_for: z.enum(['member', 'beneficiary']),
  beneficiary_id: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  date_of_death: z
    .string()
    .min(1, 'Date of death is required'),
  notes: z
    .string()
    .max(500, 'Notes are too long')
    .optional()
    .or(z.literal('')),
}).refine((data) => data.claim_for === 'member' || !!data.beneficiary_id, {
  message: 'Please select a beneficiary',
  path: ['beneficiary_id'],
})

export const claimApprovalSchema = z.object({
  amount_approved: z
    .number({ required_error: 'Approved amount is required' })
    .positive('Approved amount must be greater than zero'),
})

export const claimRejectionSchema = z.object({
  rejection_reason: z
    .string()
    .min(5, 'Please provide a rejection reason')
    .max(500, 'Reason is too long'),
})
