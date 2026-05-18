import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatDateTime, formatCurrency, formatMonthYear } from './formatters'

const ORG_NAME = 'Pfukani Magaza Burial Society'
const ORG_LOCATION = 'Limpopo, South Africa'
const ORG_PHONE = '+27 (0)71 234 5678'
const ORG_EMAIL = 'info@pfukani.org'
const BRAND_GREEN = [42, 140, 52]      // #2A8C34
const BRAND_CHARCOAL = [60, 60, 60]   // #3C3C3C

/**
 * Generates and downloads a PDF receipt for a given payment.
 *
 * @param {Object} payment   - Payment row from the database
 * @param {Object} member    - { full_name, member_number }
 * @param {string} recordedByName - Name of the staff member who recorded it
 */
export function generateAndDownloadReceipt(payment, member, recordedByName = 'System') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_GREEN)
  doc.rect(0, 0, pageW, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(ORG_NAME, pageW / 2, 14, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${ORG_LOCATION}  ·  ${ORG_PHONE}  ·  ${ORG_EMAIL}`, pageW / 2, 22, { align: 'center' })

  // OFFICIAL RECEIPT label
  doc.setFillColor(255, 255, 255, 0.15)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(245, 197, 24)   // brand-yellow
  doc.text('OFFICIAL RECEIPT', pageW / 2, 32, { align: 'center' })

  // ── Receipt number ────────────────────────────────────────────────────────
  doc.setTextColor(...BRAND_CHARCOAL)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Receipt Number', margin, 48)

  doc.setFontSize(16)
  doc.setFont('courier', 'bold')
  doc.setTextColor(...BRAND_GREEN)
  doc.text(payment.receipt_number ?? '—', margin, 57)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(`Issued: ${formatDateTime(payment.paid_at)}`, margin, 64)

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, 70, pageW - margin, 70)

  // ── Member section ────────────────────────────────────────────────────────
  let y = 78

  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.text('MEMBER DETAILS', margin, y)
  y += 6

  doc.setFontSize(11)
  doc.setTextColor(...BRAND_CHARCOAL)
  doc.setFont('helvetica', 'bold')
  doc.text(member.full_name ?? '—', margin, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  doc.setTextColor(...BRAND_GREEN)
  doc.text(member.member_number ?? '—', margin, y)
  y += 10

  // ── Payment details table ─────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Description', 'Details']],
    body: [
      ['Month Covered', formatMonthYear(payment.month_year)],
      ['Amount Paid', formatCurrency(payment.amount)],
      ['Date of Payment', formatDate(payment.paid_at)],
      ['Recorded By', recordedByName],
    ],
    headStyles: {
      fillColor: BRAND_GREEN,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: BRAND_CHARCOAL,
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [248, 255, 249] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  })

  // ── Amount highlight ──────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 8
  doc.setFillColor(240, 255, 241)
  doc.roundedRect(margin, finalY, pageW - margin * 2, 20, 3, 3, 'F')

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.text('TOTAL RECEIVED', margin + 4, finalY + 8)

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND_GREEN)
  doc.text(formatCurrency(payment.amount), pageW - margin - 4, finalY + 13, { align: 'right' })

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 12
  doc.setFillColor(...BRAND_CHARCOAL)
  doc.rect(0, footerY - 4, pageW, 20, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text(
    `This receipt is issued by ${ORG_NAME}  ·  Powered by BSMS`,
    pageW / 2,
    footerY + 4,
    { align: 'center' }
  )

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `Receipt-${payment.receipt_number ?? 'unknown'}.pdf`
  doc.save(filename)
}
