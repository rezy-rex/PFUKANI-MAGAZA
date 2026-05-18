/**
 * Wraps every authenticated page with:
 * - Top padding to clear the fixed navbar
 * - Consistent horizontal padding
 * - Optional page title section
 *
 * Props:
 *   title       string    Optional page heading
 *   subtitle    string    Optional subheading
 *   actions     ReactNode Optional top-right action buttons
 *   children    ReactNode Page content
 */
export default function PageWrapper({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen bg-brand-grey">
      {/* Spacer for fixed navbar */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page header */}
          {(title || actions) && (
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                {title && <h1 className="page-title">{title}</h1>}
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
              {actions && (
                <div className="flex items-center gap-3 flex-wrap">
                  {actions}
                </div>
              )}
            </div>
          )}

          {/* Page content */}
          {children}
        </div>
      </div>
    </div>
  )
}
