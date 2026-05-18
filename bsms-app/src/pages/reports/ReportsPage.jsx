import { useState } from 'react'
import { BarChart2, FileText, Users, Heart } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import Navbar from '../../components/layout/Navbar'
import PageWrapper from '../../components/layout/PageWrapper'
import { useAuthStore } from '../../store/authStore'
import { getMonthlyPaymentReport, getMemberStatusReport, getClaimsSummaryReport, getAuditLogReport } from '../../services/reportService'
import { generateMonthlyPaymentReportPDF, generateMemberStatusReportPDF, generateClaimsSummaryReportPDF, generateAuditLogReportPDF } from '../../utils/pdfGenerator'
import MonthlyPaymentReportDisplay from './MonthlyPaymentReportDisplay'
import MemberStatusReportDisplay from './MemberStatusReportDisplay'
import ClaimsSummaryReportDisplay from './ClaimsSummaryReportDisplay'
import AuditLogReportDisplay from './AuditLogReportDisplay'

const REPORT_TYPES = [
  { id: 'monthly-payment', label: 'Monthly Payments', icon: FileText },
  { id: 'member-status', label: 'Member Status', icon: Users },
  { id: 'claims-summary', label: 'Claims Summary', icon: Heart }
]

export default function ReportsPage() {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState('monthly-payment')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  // Monthly Payment filters
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth() + 1)
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear())

  // Claims filters
  const [claimsFromDate, setClaimsFromDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
  const [claimsToDate, setClaimsToDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Audit log filters
  const [auditFromDate, setAuditFromDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [auditToDate, setAuditToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [auditUserFilter, setAuditUserFilter] = useState('')

  async function loadMonthlyPaymentReport() {
    setLoading(true)
    setError(null)
    const result = await getMonthlyPaymentReport(paymentMonth, paymentYear)
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      setData(result.data)
    }
    setLoading(false)
  }

  async function loadMemberStatusReport() {
    setLoading(true)
    setError(null)
    const result = await getMemberStatusReport()
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      setData(result.data)
    }
    setLoading(false)
  }

  async function loadClaimsSummaryReport() {
    setLoading(true)
    setError(null)
    const result = await getClaimsSummaryReport(claimsFromDate, claimsToDate)
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      setData(result.data)
    }
    setLoading(false)
  }

  async function loadAuditLogReport() {
    setLoading(true)
    setError(null)
    const result = await getAuditLogReport(auditFromDate, auditToDate, auditUserFilter)
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      setData(result.data)
    }
    setLoading(false)
  }

  async function handleLoadReport() {
    switch (activeTab) {
      case 'monthly-payment':
        await loadMonthlyPaymentReport()
        break
      case 'member-status':
        await loadMemberStatusReport()
        break
      case 'claims-summary':
        await loadClaimsSummaryReport()
        break
      case 'audit-log':
        await loadAuditLogReport()
        break
      default:
        break
    }
  }

  // Now async — all generators are async because addHeader fetches the logo
  async function handleDownloadPDF() {
    if (!data) return

    setDownloading(true)

    try {
      let doc
      let filename

      switch (activeTab) {
        case 'monthly-payment':
          doc = await generateMonthlyPaymentReportPDF(data, paymentMonth, paymentYear)
          filename = `PaymentReport_${paymentYear}-${String(paymentMonth).padStart(2, '0')}.pdf`
          break
        case 'member-status':
          doc = await generateMemberStatusReportPDF(data)
          filename = `MemberStatusReport_${format(new Date(), 'yyyy-MM-dd')}.pdf`
          break
        case 'claims-summary':
          doc = await generateClaimsSummaryReportPDF(data, claimsFromDate, claimsToDate)
          filename = `ClaimsReport_${claimsFromDate}_to_${claimsToDate}.pdf`
          break
        case 'audit-log':
          doc = await generateAuditLogReportPDF(data, auditFromDate, auditToDate)
          filename = `AuditLogReport_${auditFromDate}_to_${auditToDate}.pdf`
          break
        default:
          return
      }

      doc.save(filename)
      toast.success('Report downloaded')
    } catch (err) {
      toast.error('Failed to generate PDF. Please try again.')
      console.error('PDF generation error:', err)
    } finally {
      setDownloading(false)
    }
  }

  const reportTypes = profile?.role === 'admin'
    ? [...REPORT_TYPES, { id: 'audit-log', label: 'Audit Log', icon: FileText }]
    : REPORT_TYPES

  return (
    <>
      <Navbar />
      <PageWrapper title="Reports" subtitle="Generate and download system reports">

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {reportTypes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id)
                setData(null)
                setError(null)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === id
                  ? 'bg-brand-green text-white'
                  : 'bg-gray-100 text-brand-charcoal hover:bg-gray-200'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="card mb-6">
          {activeTab === 'monthly-payment' && (
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={paymentMonth}
                  onChange={(e) => setPaymentMonth(Number(e.target.value))}
                  className="input"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2025, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={paymentYear}
                  onChange={(e) => setPaymentYear(Number(e.target.value))}
                  className="input w-32"
                />
              </div>
              <button
                onClick={handleLoadReport}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {data && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="btn btn-outline"
                >
                  {downloading ? 'Preparing PDF...' : 'Download PDF'}
                </button>
              )}
            </div>
          )}

          {activeTab === 'member-status' && (
            <div className="flex gap-4">
              <button
                onClick={handleLoadReport}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {data && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="btn btn-outline"
                >
                  {downloading ? 'Preparing PDF...' : 'Download PDF'}
                </button>
              )}
            </div>
          )}

          {activeTab === 'claims-summary' && (
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={claimsFromDate}
                  onChange={(e) => setClaimsFromDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={claimsToDate}
                  onChange={(e) => setClaimsToDate(e.target.value)}
                  className="input"
                />
              </div>
              <button
                onClick={handleLoadReport}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {data && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="btn btn-outline"
                >
                  {downloading ? 'Preparing PDF...' : 'Download PDF'}
                </button>
              )}
            </div>
          )}

          {activeTab === 'audit-log' && (
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={auditFromDate}
                  onChange={(e) => setAuditFromDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={auditToDate}
                  onChange={(e) => setAuditToDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by User (optional)
                </label>
                <input
                  type="text"
                  placeholder="User name..."
                  value={auditUserFilter}
                  onChange={(e) => setAuditUserFilter(e.target.value)}
                  className="input"
                />
              </div>
              <button
                onClick={handleLoadReport}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {data && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="btn btn-outline"
                >
                  {downloading ? 'Preparing PDF...' : 'Download PDF'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="card bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-green border-t-transparent mx-auto mb-3" />
            <p className="text-gray-500">Generating report...</p>
          </div>
        )}

        {/* Report Display */}
        {data && !loading && (
          <>
            {activeTab === 'monthly-payment' && <MonthlyPaymentReportDisplay data={data} />}
            {activeTab === 'member-status' && <MemberStatusReportDisplay data={data} />}
            {activeTab === 'claims-summary' && <ClaimsSummaryReportDisplay data={data} />}
            {activeTab === 'audit-log' && <AuditLogReportDisplay data={data} />}
          </>
        )}

        {/* Empty state */}
        {!data && !loading && (
          <div className="card text-center py-12">
            <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Select a report type and click Generate Report to view data
            </p>
          </div>
        )}

      </PageWrapper>
    </>
  )
}