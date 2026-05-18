import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import DashboardRouter from './pages/dashboard/DashboardRouter'
import MemberListPage from './pages/members/MemberListPage'
import MemberRegisterPage from './pages/members/MemberRegisterPage'
import MemberDetailsPage from './pages/members/MemberDetailsPage'
import MemberEditPage from './pages/members/MemberEditPage'
import MemberStatusPage from './pages/members/MemberStatusPage'
import MemberProfilePage from './pages/members/MemberProfilePage'
import RecordPaymentPage from './pages/payments/RecordPaymentPage'
import PaymentHistoryPage from './pages/payments/PaymentHistoryPage'
import OverdueMembersPage from './pages/payments/OverdueMembersPage'
import BeneficiaryListPage from './pages/beneficiaries/BeneficiaryListPage'
import BeneficiaryFormPage from './pages/beneficiaries/BeneficiaryFormPage'
import ClaimsListPage from './pages/claims/ClaimsListPage'
import ClaimSubmitPage from './pages/claims/ClaimSubmitPage'
import ClaimDetailsPage from './pages/claims/ClaimDetailsPage'
import ReportsPage from './pages/reports/ReportsPage'
import AccessDeniedPage from './pages/AccessDeniedPage'
import ProtectedRoute from './routes/ProtectedRoute'

export default function App() {
  const { initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-green flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-white border-t-transparent mx-auto mb-5" />
          <p className="text-white font-semibold text-lg">Pfukani Magaza BSMS</p>
          <p className="text-white/60 text-sm mt-1">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' },
          success: {
            style: { background: '#2A8C34', color: 'white' },
            iconTheme: { primary: 'white', secondary: '#2A8C34' },
          },
          error: {
            style: { background: '#dc2626', color: 'white' },
            iconTheme: { primary: 'white', secondary: '#dc2626' },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

        <Route
          path="/members"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><MemberListPage /></ProtectedRoute>}
        />
        <Route
          path="/members/register"
          element={<ProtectedRoute allowedRoles={['admin']}><MemberRegisterPage /></ProtectedRoute>}
        />
        <Route
          path="/members/me"
          element={<ProtectedRoute allowedRoles={['member']}><MemberProfilePage /></ProtectedRoute>}
        />
        <Route
          path="/members/me/beneficiaries"
          element={<ProtectedRoute allowedRoles={['member']}><BeneficiaryListPage self /></ProtectedRoute>}
        />
        <Route
          path="/members/:id"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><MemberDetailsPage /></ProtectedRoute>}
        />
        <Route
          path="/members/:id/edit"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><MemberEditPage /></ProtectedRoute>}
        />
        <Route
          path="/members/:id/status"
          element={<ProtectedRoute allowedRoles={['admin']}><MemberStatusPage /></ProtectedRoute>}
        />
        <Route
          path="/members/:id/beneficiaries"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><BeneficiaryListPage /></ProtectedRoute>}
        />
        <Route
          path="/members/:id/beneficiaries/add"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><BeneficiaryFormPage mode="add" /></ProtectedRoute>}
        />
        <Route
          path="/members/:id/beneficiaries/:beneficiaryId/edit"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><BeneficiaryFormPage mode="edit" /></ProtectedRoute>}
        />

        <Route
          path="/payments/record"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><RecordPaymentPage /></ProtectedRoute>}
        />
        <Route
          path="/payments/history/me"
          element={<ProtectedRoute allowedRoles={['member']}><PaymentHistoryPage /></ProtectedRoute>}
        />
        <Route
          path="/payments/history/:memberId"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><PaymentHistoryPage /></ProtectedRoute>}
        />
        <Route
          path="/payments/overdue"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><OverdueMembersPage /></ProtectedRoute>}
        />

        <Route path="/claims" element={<ProtectedRoute><ClaimsListPage /></ProtectedRoute>} />
        <Route
          path="/claims/submit"
          element={<ProtectedRoute allowedRoles={['admin', 'executive']}><ClaimSubmitPage /></ProtectedRoute>}
        />
        <Route path="/claims/:id" element={<ProtectedRoute><ClaimDetailsPage /></ProtectedRoute>} />
        <Route
          path="/reports/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'executive']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
