import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate, formatMonthYear } from './formatters'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 14

async function getLogoBase64() {
  try {
    const response = await fetch('https://iili.io/ByJNfaV.md.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function addHeader(doc, title, subtitle = '') {
  const logoBase64 = await getLogoBase64()

  // Green header bar
  doc.setFillColor(42, 140, 52)
  doc.rect(0, 0, PAGE_WIDTH, 38, 'F')

  // Logo on the left if available
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', MARGIN, 4, 28, 28)
  }

  // Text position shifts right if logo is present
  const textX = logoBase64 ? MARGIN + 32 : MARGIN

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text('Pfukani Magaza Burial Society', textX, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(220, 255, 220)
  doc.text(title, textX, 23)

  if (subtitle) {
    doc.setFontSize(9)
    doc.setTextColor(180, 230, 180)
    doc.text(subtitle, textX, 30)
  }

  // Yellow accent line under header
  doc.setFillColor(245, 197, 24)
  doc.rect(0, 38, PAGE_WIDTH, 1.5, 'F')

  doc.setTextColor(0, 0, 0)
  return 44
}

function addFooter(doc, pageNumber) {
  const pageCount = doc.getNumberOfPages()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Page ${pageNumber} of ${pageCount}`,
    PAGE_WIDTH - MARGIN - 25,
    PAGE_HEIGHT - 6
  )
  doc.text(
    `Generated: ${new Date().toLocaleString('en-ZA')}`,
    MARGIN,
    PAGE_HEIGHT - 6
  )
  // Bottom accent line
  doc.setDrawColor(42, 140, 52)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, PAGE_HEIGHT - 10, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10)
}

export async function generateMonthlyPaymentReportPDF(data, month, year) {
  const doc = new jsPDF()
  let y = await addHeader(
    doc,
    'Monthly Payment Report',
    `Period: ${formatMonthYear(year + '-' + String(month).padStart(2, '0'))}`
  )

  // Summary box
  y += 4
  doc.setFillColor(240, 248, 240)
  doc.setDrawColor(42, 140, 52)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Total Members: ${data.totalMembers}`, MARGIN + 4, y + 7)
  doc.text(`Paid: ${data.paidCount}`, MARGIN + 50, y + 7)
  doc.text(`Unpaid: ${data.unpaidCount}`, MARGIN + 80, y + 7)
  doc.text(
    `Collection Rate: ${data.collectionRate.toFixed(1)}%`,
    MARGIN + 115,
    y + 7
  )
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(42, 140, 52)
  doc.text(`Total Collected: ${formatCurrency(data.totalAmount)}`, MARGIN + 4, y + 17)
  doc.setTextColor(0, 0, 0)

  y += 28

  // Paid Members Table
  if (data.paidMembers.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(42, 140, 52)
    doc.text('Members Who Paid', MARGIN, y)
    doc.setTextColor(0, 0, 0)
    y += 4

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Member #', 'Full Name', 'Receipt #', 'Amount']],
      body: data.paidMembers.slice(0, 100).map(m => [
        m.member_number || '—',
        m.full_name || '—',
        m.receipt_number || '—',
        formatCurrency(m.amount)
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [42, 140, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 252, 245] }
    })

    y = doc.lastAutoTable.finalY + 8
  }

  // Unpaid Members Table
  if (data.unpaidMembers.length > 0) {
    if (y > PAGE_HEIGHT - 60) {
      doc.addPage()
      y = MARGIN + 10
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(180, 60, 60)
    doc.text('Members With Outstanding Payments', MARGIN, y)
    doc.setTextColor(0, 0, 0)
    y += 4

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Member #', 'Full Name', 'Phone']],
      body: data.unpaidMembers.slice(0, 100).map(m => [
        m.member_number || '—',
        m.full_name || '—',
        m.phone || '—'
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [180, 60, 60],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [255, 248, 248] }
    })
  }

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  return doc
}

export async function generateMemberStatusReportPDF(data) {
  const doc = new jsPDF()
  let y = await addHeader(
    doc,
    'Member Status Report',
    `Generated: ${new Date().toLocaleDateString('en-ZA')}`
  )

  y += 4
  doc.setFillColor(240, 248, 240)
  doc.setDrawColor(42, 140, 52)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Active: ${data.statusBreakdown.active}`, MARGIN + 4, y + 7)
  doc.text(`Deceased: ${data.statusBreakdown.deceased}`, MARGIN + 35, y + 7)
  doc.text(`Resigned: ${data.statusBreakdown.resigned}`, MARGIN + 75, y + 7)
  doc.text(`Suspended: ${data.statusBreakdown.suspended}`, MARGIN + 115, y + 7)
  doc.text(
    `New Members This Month: ${data.newMembersThisMonth}`,
    MARGIN + 4,
    y + 17
  )
  doc.setTextColor(0, 0, 0)

  y += 28

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(42, 140, 52)
  doc.text('Full Member List', MARGIN, y)
  doc.setTextColor(0, 0, 0)
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Member #', 'Full Name', 'Status', 'Joined Date', 'Phone']],
    body: data.allMembers.slice(0, 200).map(m => [
      m.member_number || '—',
      m.full_name || '—',
      m.status.charAt(0).toUpperCase() + m.status.slice(1),
      formatDate(m.joined_date),
      m.phone || '—'
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [42, 140, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 252, 245] }
  })

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  return doc
}

export async function generateClaimsSummaryReportPDF(data, fromDate, toDate) {
  const doc = new jsPDF()
  let y = await addHeader(
    doc,
    'Claims Summary Report',
    `Period: ${formatDate(fromDate)} — ${formatDate(toDate)}`
  )

  y += 4
  doc.setFillColor(240, 248, 240)
  doc.setDrawColor(42, 140, 52)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, 28, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Total Claims: ${data.totalClaims}`, MARGIN + 4, y + 7)
  doc.text(`Submitted: ${data.statusBreakdown.submitted}`, MARGIN + 4, y + 14)
  doc.text(`Under Review: ${data.statusBreakdown.under_review}`, MARGIN + 45, y + 14)
  doc.text(`Approved: ${data.statusBreakdown.approved}`, MARGIN + 95, y + 14)
  doc.text(`Rejected: ${data.statusBreakdown.rejected}`, MARGIN + 135, y + 14)
  doc.text(`Paid: ${data.statusBreakdown.paid}`, MARGIN + 168, y + 14)
  doc.setFontSize(10)
  doc.setTextColor(42, 140, 52)
  doc.text(
    `Total Approved: ${formatCurrency(data.totalApprovedAmount)}   |   Total Paid Out: ${formatCurrency(data.totalPaidAmount)}`,
    MARGIN + 4,
    y + 23
  )
  doc.setTextColor(0, 0, 0)

  y += 34

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(42, 140, 52)
  doc.text('Claims Details', MARGIN, y)
  doc.setTextColor(0, 0, 0)
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Member', 'Status', 'Approved Amount', 'Paid Out', 'Submitted']],
    body: data.claims.slice(0, 100).map(c => [
      c.member || '—',
      c.status.replace('_', ' ').charAt(0).toUpperCase() +
      c.status.slice(1).replace('_', ' '),
      formatCurrency(c.amount_approved || 0),
      c.status === 'paid' ? formatCurrency(c.amount_approved || 0) : '—',
      formatDate(c.submitted_at)
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [42, 140, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 252, 245] }
  })

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  return doc
}

export async function generateAuditLogReportPDF(data, fromDate, toDate) {
  const doc = new jsPDF()
  let y = await addHeader(
    doc,
    'Audit Log Report',
    `Period: ${formatDate(fromDate)} — ${formatDate(toDate)}`
  )

  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['User', 'Operation', 'Table', 'Description', 'Date & Time']],
    body: data.entries.slice(0, 200).map(e => [
      e.user_name || '—',
      e.operation || '—',
      e.table_name || '—',
      e.description || '—',
      formatDate(e.changed_at)
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [42, 140, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 252, 245] },
    columnStyles: {
      3: { cellWidth: 65 }
    }
  })

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  return doc
}