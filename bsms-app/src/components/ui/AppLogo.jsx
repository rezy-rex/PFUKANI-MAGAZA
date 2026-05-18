import logoUrl from '../../../images/logo.webp'

export default function AppLogo({ className = 'w-10 h-10', alt = 'Pfukani Magaza logo' }) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      className={`${className} object-contain`}
      loading="eager"
      decoding="async"
    />
  )
}
