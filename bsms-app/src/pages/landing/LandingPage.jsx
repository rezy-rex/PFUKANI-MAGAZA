import { Link } from 'react-router-dom'
import LandingNavbar from '../../components/layout/LandingNavbar'
import {
  Heart, DollarSign, Users, MapPin, Phone, Mail,
  Shield, ArrowRight, CheckCircle
} from 'lucide-react'
import AppLogo from '../../components/ui/AppLogo'
import heroImgUrl from '../../../images/hero_community_team.png'

const SERVICES = [
  {
    icon: DollarSign,
    title: 'Financial Support',
    description: 'Immediate financial assistance to cover funeral costs and related expenses when a member or beneficiary passes away.',
    color: 'bg-emerald-50 text-brand-green border border-emerald-100/50',
  },
  {
    icon: Heart,
    title: 'Logistical Assistance',
    description: 'Coordination and guidance through the claim and funeral process so families are never left alone during their hardest time.',
    color: 'bg-amber-50 text-amber-600 border border-amber-100/50',
  },
  {
    icon: Shield,
    title: 'Member Benefits',
    description: 'Coverage for up to 10 beneficiaries per membership. A simple R200 monthly contribution keeps your entire family protected.',
    color: 'bg-blue-50 text-blue-600 border border-blue-100/50',
  },
]

const STATS = [
  { value: '400+', label: 'Registered Members' },
  { value: '10', label: 'Beneficiaries Per Member' },
  { value: 'R200', label: 'Monthly Contribution' },
  { value: '6', label: 'Directors' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-brand-charcoal selection:bg-brand-green/10 selection:text-brand-green font-sans relative overflow-x-hidden">
      <LandingNavbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-b from-slate-50/50 to-white"
      >
        {/* Modern Mesh Gradients */}
        <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-gradient-to-tr from-brand-green/15 to-emerald-300/20 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 translate-x-1/3 w-[45vw] h-[45vw] max-w-[600px] rounded-full bg-gradient-to-bl from-teal-200/10 to-brand-yellow/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 translate-x-1/4 translate-y-1/4 w-[35vw] h-[35vw] max-w-[450px] rounded-full bg-gradient-to-br from-brand-green/10 to-blue-200/15 blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Premium Headline & Action */}
            <div className="lg:col-span-7 text-left space-y-8">
              {/* Badge */}
              <div>
                <span className="inline-flex items-center gap-2 bg-brand-green/10 text-brand-green text-xs font-semibold px-4 py-2 rounded-full tracking-wider uppercase border border-brand-green/20">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                  NPO / NPC Registered · CIPC
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-charcoal leading-tight tracking-tight">
                Dignified <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">Burial Care</span> is our Solemn <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-brand-green">Promise</span>.
              </h1>

              {/* Subtitle */}
              <p className="text-gray-600 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl">
                A community built on Ubuntu and trust. We stand together so no family ever faces loss alone. 
                Experience comprehensive, transparent support and absolute peace of mind.
              </p>

              {/* Premium Call to Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg shadow-brand-green/25 hover:shadow-xl hover:shadow-brand-green/45 hover:-translate-y-0.5 transition-all duration-300 text-base"
                >
                  <Users className="w-5 h-5" />
                  Member Portal Access
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-brand-green/50 text-brand-charcoal hover:text-brand-green font-semibold px-8 py-4 rounded-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-base"
                >
                  <Shield className="w-5 h-5" />
                  Staff Login
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-6 border-t border-gray-100/80 flex flex-wrap items-center gap-x-8 gap-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <CheckCircle className="w-4 h-4 text-brand-green" />
                  <span>400+ Active Members</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <CheckCircle className="w-4 h-4 text-brand-green" />
                  <span>R200 flat monthly fee</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <CheckCircle className="w-4 h-4 text-brand-green" />
                  <span>Up to 10 Beneficiaries</span>
                </div>
              </div>
            </div>

            {/* Right Column: Rounded Image Graphic */}
            <div className="lg:col-span-5 relative w-full flex justify-center">
              {/* Soft colorful backdrop shadow */}
              <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-brand-green/20 to-brand-yellow/10 opacity-30 blur-2xl pointer-events-none" />
              {/* Image Frame */}
              <div className="relative bg-white p-3.5 rounded-[2.5rem] shadow-2xl border border-gray-100/60 overflow-hidden max-w-md lg:max-w-full w-full">
                <img
                  src={heroImgUrl}
                  alt="Pfukani Magaza Community Support"
                  className="rounded-[2rem] w-full object-cover aspect-[4/3] shadow-inner"
                  loading="eager"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
          <a href="#about" className="w-6 h-10 border-2 border-gray-300 rounded-full flex items-start justify-center p-1.5 hover:border-brand-green transition-colors">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
          </a>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section className="relative z-20 -mt-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/70 border border-gray-100/60 p-8 sm:p-10 backdrop-blur-md bg-white/90">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y-2 sm:divide-y-0 lg:divide-y-0 lg:divide-x divide-gray-100">
            {STATS.map(({ value, label }, index) => (
              <div key={label} className={`text-center ${index > 0 ? 'lg:pl-6' : ''} ${index > 1 ? 'pt-6 sm:pt-0' : ''} ${index === 1 ? 'pt-6 sm:pt-0' : ''}`}>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">
                  {value}
                </div>
                <div className="text-gray-400 font-bold text-xs mt-2 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────── */}
      <section id="about" className="bg-white py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Text content */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 text-brand-green font-bold text-xs uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <Heart className="w-3.5 h-3.5" /> About Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-charcoal leading-tight tracking-tight">
                A Community Organisation <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">Built on Ubuntu</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Pfukani Magaza Burial Society is a registered NPO/NPC with the Companies and Intellectual
                Property Commission (CIPC) in South Africa. Based in Limpopo, we have been serving our
                community by providing financial and logistical support to member families in their time of need.
              </p>
              <p className="text-gray-600 leading-relaxed">
                With over <strong className="text-brand-charcoal font-semibold">400 registered members</strong>, a team of <strong className="text-brand-charcoal font-semibold">6 Directors</strong> and <strong className="text-brand-charcoal font-semibold">32 Executives</strong>,
                we are committed to ensuring that no family is left without support when they need it most.
                A single R200 monthly contribution covers the member and up to 10 beneficiaries.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  'CIPC registered NPO/NPC structure',
                  'Comprehensive coverage for up to 10 beneficiaries per member',
                  'Fully transparent, audited operations and reports',
                  'Secured digital record-keeping system (BSMS)',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100/50 hover:border-brand-green/20 transition-all duration-200">
                    <CheckCircle className="w-5 h-5 text-brand-green shrink-0" />
                    <span className="text-gray-700 font-medium text-sm sm:text-base">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card - elevated style */}
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-green to-emerald-800 rounded-3xl p-10 text-white shadow-2xl shadow-green-950/20 relative overflow-hidden">
                {/* Decorative Blur Inside Card */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* AppLogo without border */}
                <div className="mb-8">
                  <AppLogo className="w-14 h-14 filter brightness-0 invert" />
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">Our Mission</h3>
                <p className="text-white/90 leading-relaxed text-lg italic font-normal">
                  "To provide dignified, compassionate, and financially accessible burial support
                  to every member of our community — ensuring that love for our departed is never
                  constrained by circumstance."
                </p>
                <div className="mt-8 pt-6 border-t border-white/15 flex items-center justify-between text-white/70 text-sm">
                  <span>Limpopo, South Africa</span>
                  <span className="font-semibold uppercase tracking-wider text-brand-yellow">Est. CIPC Registered</span>
                </div>
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-yellow/20 rounded-3xl -z-10 blur-md" />
            </div>

          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section id="services" className="bg-slate-50/40 border-y border-gray-100/80 py-24 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-brand-green/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-brand-green font-bold text-xs uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <Shield className="w-3.5 h-3.5" /> What We Provide
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-charcoal tracking-tight mt-4">
              Comprehensive Member Benefits
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">
              Every contribution goes toward protecting our community members and their loved ones.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {SERVICES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-gray-100/50 border border-gray-100/60 hover:border-brand-green/20 transition-all duration-300 hover:-translate-y-1.5 group flex flex-col justify-between"
              >
                <div>
                  <div className={`rounded-2xl p-4 inline-flex mb-6 ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-charcoal mb-3 tracking-tight">{title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA within services */}
          <div className="text-center mt-16">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-brand-green font-semibold hover:gap-3 transition-all duration-200 group"
            >
              <span>Access your secure member account portal</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT ─────────────────────────────────────────── */}
      <section id="contact" className="bg-brand-charcoal py-24 relative overflow-hidden">
        {/* Decorative inner blurs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-green/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-brand-yellow font-bold text-xs uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <Mail className="w-3.5 h-3.5" /> Get In Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
              Contact Information
            </h2>
            <p className="text-white/60 mt-4 text-lg">
              Reach out to us for membership enquiries or to report a claim.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                label: 'Our Location',
                value: 'Limpopo, South Africa',
                sub: 'Serving the surrounding community',
              },
              {
                icon: Phone,
                label: 'Phone Support',
                value: '+27 (0)71 234 5678',
                sub: 'Monday – Friday, 8am – 5pm',
              },
              {
                icon: Mail,
                label: 'Email Enquiries',
                value: 'info@pfukani.org',
                sub: 'We respond within 24 hours',
              },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div
                key={label}
                className="bg-white/5 border border-white/10 hover:border-brand-green/30 rounded-3xl p-8 text-center hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="bg-brand-green/20 rounded-2xl p-4 inline-flex mb-4">
                  <Icon className="w-6 h-6 text-brand-green" />
                </div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-bold">{label}</p>
                <p className="text-white font-extrabold text-lg tracking-tight">{value}</p>
                <p className="text-white/50 text-sm mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-black py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-white">
            <AppLogo className="w-10 h-10" />
            <div>
              <span className="font-extrabold tracking-tight block text-lg">Pfukani Magaza</span>
              <span className="text-white/50 text-xs block">Burial Society</span>
            </div>
          </div>
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Pfukani Magaza Forum. Powered by BSMS.
          </p>
        </div>
      </footer>
    </div>
  )
}

