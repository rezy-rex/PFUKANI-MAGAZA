import { format, parseISO, isValid } from 'date-fns'

// ── Currency ──────────────────────────────────────────────────────────────────

/**
 * Formats a number as South African Rand.
 * formatCurrency(200) → "R 200.00"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'R 0.00'
  return `R ${Number(amount).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ── Dates ─────────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string or Date object for display.
 * formatDate('2025-05-17') → "17 May 2025"
 */
export function formatDate(dateString) {
  if (!dateString) return '—'
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    if (!isValid(date)) return '—'
    return format(date, 'd MMM yyyy')
  } catch {
    return '—'
  }
}

/**
 * Formats an ISO datetime string for display with time.
 * formatDateTime('2025-05-17T10:30:00Z') → "17 May 2025, 10:30"
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—'
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    if (!isValid(date)) return '—'
    return format(date, 'd MMM yyyy, HH:mm')
  } catch {
    return '—'
  }
}

/**
 * Converts a YYYY-MM month_year string to a human-readable month.
 * formatMonthYear('2025-05') → "May 2025"
 */
export function formatMonthYear(monthYear) {
  if (!monthYear) return '—'
  try {
    const date = parseISO(`${monthYear}-01`)
    if (!isValid(date)) return monthYear
    return format(date, 'MMMM yyyy')
  } catch {
    return monthYear
  }
}

/**
 * Returns the current month in YYYY-MM format for use as a default value.
 */
export function currentMonthYear() {
  return format(new Date(), 'yyyy-MM')
}

// ── Status labels ─────────────────────────────────────────────────────────────

/** Human-readable label for member statuses */
export function memberStatusLabel(status) {
  const labels = {
    active: 'Active',
    suspended: 'Suspended',
    deceased: 'Deceased',
    resigned: 'Resigned',
    inactive: 'Inactive',
  }
  return labels[status] ?? status
}

/** Human-readable label for claim statuses */
export function claimStatusLabel(status) {
  const labels = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
  }
  return labels[status] ?? status
}

// ── Truncation ────────────────────────────────────────────────────────────────

export function truncate(str, maxLength = 50) {
  if (!str) return ''
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str
}
