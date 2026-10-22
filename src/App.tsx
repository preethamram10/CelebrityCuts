import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import { Dashboard as AdminDashboard, ReportsPage, BranchManagement, BranchDetails } from './pages/admin'
import BranchManagerDashboard from './pages/branch-manager/Dashboard'
import ManagerAttendance from './pages/branch-manager/Attendance'
import RevenuePage from './pages/branch-manager/RevenuePage'
import ManagerCustomers from './pages/branch-manager/Customers'
import StaffPage from './pages/branch-manager/StaffPage'
import ServicesPage from './pages/branch-manager/ServicesPage'
import ManagerBillingHistory from './pages/branch-manager/BillingHistory'
import BillingStaffPage from './pages/billing-staff'
import HairExtensionsPage from './pages/billing-staff/HairExtensionsPage'
import BillingAttendancePage from './pages/billing-staff/AttendancePage'
import AttendanceTracking from './pages/AttendanceTracking'
import BillingHistory from './pages/BillingHistory'
import { authService, User } from './services/authService'
import StaffRevenuePage from './pages/branch-manager/StaffRevenue'
import StaffBillingDetails from './pages/branch-manager/StaffBillingDetails'
import InvoiceDownload from './pages/InvoiceDownload'
import AppointmentsPage from './pages/AppointmentsPage'
import DataMigrationPage from './pages/DataMigrationPage'

import './App.css'
function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const storedUser = authService.getCurrentUser()
    if (storedUser) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  // Session Check Effect
  // Session Check Effect
  /*
  useEffect(() => {
    if (!user || !user.sessionToken) return;

    const checkSession = async () => {
      const isValid = await authService.checkSessionValidity(user.id, user.sessionToken!);
      if (!isValid) {
        alert("Session expired. You have been logged in on another device.");
        handleLogout();
      }
    };

    // Check immediately and then every 30 seconds
    checkSession();
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, [user]);
  */

  const handleLogin = (user: User) => {
    setUser(user)
  }

  const handleLogout = () => {
    authService.logout()
    setUser(null)
  }

  if (loading) return <div style={{ background: '#000', height: '100vh' }}></div> // Simple loading state

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* PUBLIC ROUTE: Invoice Download */}
        <Route path="/invoice/:invoiceNo" element={<InvoiceDownload />} />

        {/* PUBLIC ROUTE: Login (Only if not logged in) */}
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === 'manager' ? "/manager/dashboard" : "/dashboard"} />} />

        {/* PROTECTED ROUTES */}
        <Route path="/*" element={
          !user ? (
            <Navigate to="/login" replace />
          ) : (
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to={user.role === 'manager' ? '/manager/dashboard' : '/dashboard'} replace />} />

              {/* ADMIN ROUTES */}
              {user.role === 'admin' && (
                <>
                  <Route path="/dashboard" element={<AdminDashboard onLogout={handleLogout} />} />
                  <Route path="/appointments" element={<AppointmentsPage onLogout={handleLogout} />} />
                  <Route path="/reports" element={<ReportsPage onLogout={handleLogout} />} />
                  <Route path="/branches" element={<BranchManagement onLogout={handleLogout} />} />
                  <Route path="/branches/:branchId" element={<BranchDetails onLogout={handleLogout} />} />
                  <Route path="/billing" element={<BillingHistory onLogout={handleLogout} userType="admin" />} />
                  <Route path="/services" element={<ServicesPage onLogout={handleLogout} />} />
                  <Route path="/hair-extensions" element={<HairExtensionsPage />} />
                  <Route path="/migrate" element={<DataMigrationPage onLogout={handleLogout} />} />
                  <Route path="/attendance" element={<AttendanceTracking onLogout={handleLogout} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}

              {/* MANAGER ROUTES */}
              {user.role === 'manager' && (
                <>
                  <Route path="/manager/dashboard" element={<BranchManagerDashboard onLogout={handleLogout} />} />
                  <Route path="/appointments" element={<AppointmentsPage onLogout={handleLogout} />} />
                  <Route path="/manager/attendance" element={<ManagerAttendance onLogout={handleLogout} />} />
                  <Route path="/manager/revenue" element={<RevenuePage onLogout={handleLogout} />} />
                  <Route path="/manager/billing" element={<ManagerBillingHistory onLogout={handleLogout} />} />
                  <Route path="/manager/staffrevenue" element={<StaffRevenuePage onLogout={handleLogout} />} />
                  <Route path="/manager/staffrevenue/:staffId" element={<StaffBillingDetails onLogout={handleLogout} />} />
                  <Route path="/manager/customers" element={<ManagerCustomers onLogout={handleLogout} />} />
                  <Route path="/manager/staff" element={<StaffPage onLogout={handleLogout} />} />
                  <Route path="/manager/services" element={<ServicesPage onLogout={handleLogout} />} />
                  <Route path="/services" element={<ServicesPage onLogout={handleLogout} />} />
                  <Route path="/hair-extensions" element={<HairExtensionsPage />} />
                  <Route path="/migrate" element={<DataMigrationPage onLogout={handleLogout} />} />
                  <Route path="/dashboard" element={<Navigate to="/manager/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
                </>
              )}

              {/* BILLING STAFF ROUTES */}
              {user.role === 'billing' && (
                <>
                  <Route path="/dashboard" element={<BillingStaffPage onLogout={handleLogout} />} />
                  <Route path="/appointments" element={<AppointmentsPage onLogout={handleLogout} />} />
                  <Route path="/newbill" element={<BillingStaffPage onLogout={handleLogout} />} />
                  <Route path="/history" element={<BillingHistory onLogout={handleLogout} />} />
                  <Route path="/services" element={<ServicesPage onLogout={handleLogout} />} />
                  <Route path="/hair-extensions" element={<HairExtensionsPage />} />
                  <Route path="/attendance" element={<BillingAttendancePage />} />
                  <Route path="/customers" element={<ManagerCustomers onLogout={handleLogout} userRole="billing" />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </Routes>
          )
        } />
      </Routes>
    </Router>
  )
}

export default App
