import { Link } from 'react-router-dom'
import AppLogo from '../ui/AppLogo'

/**
 * Premium glassmorphic navbar shown on the public landing page.
 * Features a transparent blurred background, clean typography, direct page links,
 * and a polished CTA portal login button.
 */
export default function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100/60 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo + Name */}
          <a href="#hero" className="flex items-center gap-3 group">
            <AppLogo className="w-10 h-10 transition-transform duration-300 group-hover:scale-105" />
            <div>
              <span className="text-brand-charcoal font-extrabold text-lg tracking-tight block leading-none">Pfukani Magaza</span>
              <span className="text-brand-green font-bold text-xs tracking-widest uppercase block mt-1">Burial Society</span>
            </div>
          </a>



          {/* Portal Login button */}
          <Link
            to="/login"
            className="bg-brand-green text-white font-semibold px-6 py-2.5 rounded-full hover:bg-green-700 transition-all duration-300 text-sm shadow-md shadow-brand-green/10 hover:shadow-lg hover:shadow-brand-green/20 hover:-translate-y-0.5"
          >
            Portal Login
          </Link>
        </div>
      </div>
    </nav>
  )
}

