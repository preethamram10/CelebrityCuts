import { useState } from 'react'
import { Calendar, Receipt, Users, Scissors, CalendarCheck } from 'lucide-react'
import HeaderWithLogo from '../../components/HeaderWithLogo'
import AttendancePage from './AttendancePage'
import BillingPage from './BillingPage'
import CustomersPage from './CustomersPage'
import CustomerDetailsPage from './CustomerDetailsPage'
import HairExtensionsPage from './HairExtensionsPage'
import { AppointmentsSection } from '../AppointmentsPage'
import '../../theme.css'

interface BillingStaffPageProps {
  onLogout: () => void
}

const BillingStaffPage: React.FC<BillingStaffPageProps> = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState<'attendance' | 'appointments' | 'billing' | 'customers' | 'customerDetails' | 'hairExtensions'>('attendance')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  // Handler to show details page
  const handleShowCustomerDetails = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setActiveSection('customerDetails')
  }

  return (
    <div className="app-container">
      {/* Left Sidebar Menu */}
      <div className="sidebar" style={{ width: '80px', background: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
        <div style={{ marginBottom: '30px' }}>
          {/* Optional Logo Placeholder */}
        </div>

        <button
          className={`sidebar-icon ${activeSection === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveSection('attendance')}
          title="Attendance"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px 10px',
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            color: activeSection === 'attendance' ? 'var(--accent-gold)' : '#666',
            borderLeft: activeSection === 'attendance' ? '3px solid var(--accent-gold)' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          <Calendar size={24} strokeWidth={activeSection === 'attendance' ? 2.5 : 2} />
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>ATTENDANCE</span>
        </button>

        <button
          className={`sidebar-icon ${activeSection === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveSection('appointments')}
          title="Appointments"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px 10px',
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            color: activeSection === 'appointments' ? 'var(--accent-gold)' : '#666',
            borderLeft: activeSection === 'appointments' ? '3px solid var(--accent-gold)' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          <CalendarCheck size={24} strokeWidth={activeSection === 'appointments' ? 2.5 : 2} />
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textAlign: 'center' }}>APPOINTS.</span>
        </button>

        <button
          className={`sidebar-icon ${activeSection === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveSection('billing')}
          title="Billing"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px 10px',
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            color: activeSection === 'billing' ? 'var(--accent-gold)' : '#666',
            borderLeft: activeSection === 'billing' ? '3px solid var(--accent-gold)' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          <Receipt size={24} strokeWidth={activeSection === 'billing' ? 2.5 : 2} />
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>BILLING</span>
        </button>

        <button
          className={`sidebar-icon ${activeSection === 'hairExtensions' ? 'active' : ''}`}
          onClick={() => setActiveSection('hairExtensions')}
          title="Hair Extensions"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px 10px',
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            color: activeSection === 'hairExtensions' ? 'var(--accent-gold)' : '#666',
            borderLeft: activeSection === 'hairExtensions' ? '3px solid var(--accent-gold)' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          <Scissors size={24} strokeWidth={activeSection === 'hairExtensions' ? 2.5 : 2} />
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textAlign: 'center' }}>EXTENS.</span>
        </button>

        <button
          className={`sidebar-icon ${activeSection === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveSection('customers')}
          title="Customers"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px 10px',
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            color: activeSection === 'customers' ? 'var(--accent-gold)' : '#666',
            borderLeft: activeSection === 'customers' ? '3px solid var(--accent-gold)' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          <Users size={24} strokeWidth={activeSection === 'customers' ? 2.5 : 2} />
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>CUSTOMERS</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <HeaderWithLogo title="Billing Staff Portal" onLogout={onLogout} />
        <div className="content-area">
          <div className="content-shell">
            {activeSection === 'attendance' && <AttendancePage />}
            {activeSection === 'appointments' && <AppointmentsSection />}
            {activeSection === 'billing' && <BillingPage />}
            {activeSection === 'hairExtensions' && <HairExtensionsPage />}
            {activeSection === 'customers' && (
              <CustomersPage onShowCustomerDetails={handleShowCustomerDetails} />
            )}
            {activeSection === 'customerDetails' && selectedCustomerId && (
              <CustomerDetailsPage customerId={selectedCustomerId} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillingStaffPage;
