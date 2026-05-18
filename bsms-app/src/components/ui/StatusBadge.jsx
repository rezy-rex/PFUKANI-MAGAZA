import { memberStatusLabel } from '../../utils/formatters'

/**
 * Reusable coloured status badge.
 *
 * Props:
 *   status  string  The status value (e.g. 'active', 'submitted')
 *   type    string  'member' | 'claim'  — controls colour mapping
 */
export default function StatusBadge({ status, type = 'member' }) {
  const memberColours = {
    active:    'bg-brand-green text-white',
    suspended: 'bg-brand-yellow text-brand-charcoal',
    deceased:  'bg-gray-500 text-white',
    resigned:  'bg-brand-charcoal text-white',
    inactive:  'bg-gray-100 text-brand-charcoal',
  }

  const claimColours = {
    submitted:    'bg-blue-600 text-white',
    under_review: 'bg-brand-yellow text-brand-charcoal',
    approved:     'bg-brand-green text-white',
    rejected:     'bg-red-600 text-white',
    paid:         'bg-teal-600 text-white',
  }

  const colourMap = type === 'claim' ? claimColours : memberColours
  const colourClass = colourMap[status] ?? 'bg-gray-100 text-brand-charcoal'

  const label = type === 'claim'
    ? (claimLabels[status] ?? status)
    : memberStatusLabel(status)

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colourClass}`}>
      {label}
    </span>
  )
}

const claimLabels = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  approved:     'Approved',
  rejected:     'Rejected',
  paid:         'Paid',
}
