import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, User } from 'lucide-react'
import { getMembers } from '../../services/memberService'
import StatusBadge from './StatusBadge'

/**
 * Typeahead member search input.
 *
 * Props:
 *   onSelect(member)  - Called with the full member object when a result is chosen
 *   onClear()         - Called when the selection is cleared
 *   placeholder       - Input placeholder text
 *   disabled          - Disables the input
 *   error             - Validation error string to display below
 */
export default function MemberSearchInput({ onSelect, onClear, placeholder = 'Search by name or member number...', disabled = false, error }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (value) => {
    if (!value.trim() || value.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setSearching(true)
    const { data } = await getMembers({ search: value, pageSize: 8 })
    setSearching(false)
    setResults(data?.members ?? [])
    setOpen(true)
  }, [])

  // Debounce search
  useEffect(() => {
    if (selected) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, selected, search])

  const handleSelect = (member) => {
    setSelected(member)
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect(member)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    setOpen(false)
    if (onClear) onClear()
  }

  // ── Showing selected member chip ──────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-3 bg-green-50 border-2 border-brand-green rounded-lg px-4 py-3">
          <div className="bg-brand-green/10 rounded-full p-1.5 shrink-0">
            <User className="w-4 h-4 text-brand-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-brand-charcoal text-sm truncate">{selected.full_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-brand-green">{selected.member_number}</span>
              <StatusBadge status={selected.status} type="member" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    )
  }

  // ── Search input + dropdown ───────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {searching ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="spinner-dark" />
          </div>
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-input pl-9 ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-charcoal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No members found for "{query}"
            </div>
          ) : (
            results.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelect(member)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <div className="bg-gray-100 rounded-full p-1.5 shrink-0">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-charcoal text-sm truncate">{member.full_name}</p>
                  <p className="font-mono text-xs text-brand-green">{member.member_number}</p>
                </div>
                <StatusBadge status={member.status} type="member" />
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="form-error mt-1">{error}</p>}
    </div>
  )
}
