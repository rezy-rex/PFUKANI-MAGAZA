/**
 * Reusable dashboard summary card.
 *
 * Props:
 *   title     string    Card label
 *   value     string    Main numeric value
 *   subtitle  string    Optional secondary line
 *   icon      ReactNode Lucide icon component
 *   color     string    Tailwind colour class for the icon background e.g. 'bg-green-100 text-brand-green'
 */
export default function StatCard({ title, value, subtitle, icon: Icon, color = 'bg-green-100 text-brand-green' }) {
  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={`rounded-xl p-3 shrink-0 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-brand-charcoal mt-0.5 leading-tight">{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
