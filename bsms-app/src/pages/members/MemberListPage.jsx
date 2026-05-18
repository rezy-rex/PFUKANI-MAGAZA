import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Search, ChevronLeft, ChevronRight, Users, X } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import { getMembers } from '../../services/memberService'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../utils/formatters'

const STATUSES = ['', 'active', 'suspended', 'deceased', 'resigned', 'inactive']
const STATUS_LABELS = {
  '': 'All Statuses',
  active: 'Active',
  suspended: 'Suspended',
  deceased: 'Deceased',
  resigned: 'Resigned',
  inactive: 'Inactive',
}
const PAGE_SIZE = 25

export default function MemberListPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin'

  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false

    async function loadMembers() {
      setLoading(true)
      setError(null)
      const { data, error: err } = await getMembers({
        search: debouncedSearch,
        statusFilter,
        page,
        pageSize: PAGE_SIZE,
      })
      if (cancelled) return
      setLoading(false)
      if (err) { setError(err); return }
      setMembers(data.members ?? [])
      setTotal(data.total ?? 0)
    }

    loadMembers()
    return () => { cancelled = true }
  }, [debouncedSearch, statusFilter, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <Navbar />
      <PageWrapper
        title="Members"
        subtitle={`${total} member${total !== 1 ? 's' : ''} registered`}
        actions={
          isAdmin && (
            <Link to="/members/register" className="btn-primary">
              <UserPlus className="w-4 h-4" />
              Register Member
            </Link>
          )
        }
      >
        {/* Filters */}
        <div className="card mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="member-search"
                type="text"
                placeholder="Search by name, member number, or ID number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="form-input pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setPage(1) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="form-input sm:w-48"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table card */}
        <div className="card p-0 overflow-hidden">
          {error && (
            <div className="p-6 text-center text-red-600 text-sm">{error}</div>
          )}

          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">Member #</th>
                    <th className="table-header text-left">Full Name</th>
                    <th className="table-header text-left hidden md:table-cell">Phone</th>
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-left hidden lg:table-cell">Date Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                          <td className="table-cell"><div className="h-3 bg-gray-200 rounded w-40" /></td>
                          <td className="table-cell hidden md:table-cell"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                          <td className="table-cell"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
                          <td className="table-cell hidden lg:table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                        </tr>
                      ))
                    : members.length === 0
                    ? (
                        <tr>
                          <td colSpan={5}>
                            <EmptyState isAdmin={isAdmin} hasFilters={!!(search || statusFilter)} />
                          </td>
                        </tr>
                      )
                    : members.map((m) => (
                        <tr
                          key={m.id}
                          onClick={() => navigate(`/members/${m.id}`)}
                          className="hover:bg-green-50 cursor-pointer transition-colors duration-150"
                        >
                          <td className="table-cell font-mono text-xs font-semibold text-brand-green">
                            {m.member_number}
                          </td>
                          <td className="table-cell font-medium">{m.full_name}</td>
                          <td className="table-cell hidden md:table-cell text-gray-500">{m.phone}</td>
                          <td className="table-cell">
                            <StatusBadge status={m.status} type="member" />
                          </td>
                          <td className="table-cell hidden lg:table-cell text-gray-500">
                            {formatDate(m.joined_date)}
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}

function EmptyState({ isAdmin, hasFilters }) {
  return (
    <div className="py-16 text-center px-4">
      <div className="bg-gray-100 rounded-full p-5 inline-flex mb-4">
        <Users className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="font-semibold text-brand-charcoal text-lg mb-2">
        {hasFilters ? 'No members match your search' : 'No members registered yet'}
      </h3>
      <p className="text-gray-400 text-sm mb-6">
        {hasFilters
          ? 'Try adjusting your search terms or clearing the filters.'
          : 'Get started by registering your first member.'}
      </p>
      {isAdmin && !hasFilters && (
        <Link to="/members/register" className="btn-primary inline-flex">
          <UserPlus className="w-4 h-4" />
          Register First Member
        </Link>
      )}
    </div>
  )
}
