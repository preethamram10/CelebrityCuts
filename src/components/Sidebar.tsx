import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UsersRound,
  FileBarChart,
  Settings,
  CalendarCheck,
  Receipt,
  PlusCircle,
  History,
  Store,
  IndianRupee,
  Scissors,
  TrendingUp,
  Database
} from 'lucide-react'

interface SidebarProps {
  userType: 'admin' | 'manager' | 'billing'
}

export default function Sidebar({ userType }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  const getMenuItems = () => {
    // Common items
    const dashboardItem = { icon: <LayoutDashboard size={22} strokeWidth={1.5} />, title: 'Dashboard', id: 0, path: userType === 'manager' ? '/manager/dashboard' : '/dashboard' };
    const customerItem = { icon: <UsersRound size={22} strokeWidth={1.5} />, title: 'Customers', id: 1, path: userType === 'manager' ? '/manager/customers' : '/customers' };

    if (userType === 'admin') {
      return [
        dashboardItem,
        customerItem,
        { icon: <CalendarCheck size={22} strokeWidth={1.5} />, title: 'Appointments', id: 30, path: '/appointments' },
        { icon: <FileBarChart size={22} strokeWidth={1.5} />, title: 'Reports', id: 2, path: '/reports' },
        { icon: <CalendarCheck size={22} strokeWidth={1.5} />, title: 'Attendance', id: 4, path: '/attendance' },
        { icon: <Store size={22} strokeWidth={1.5} />, title: 'Branches', id: 3, path: '/branches' },
        { icon: <Receipt size={22} strokeWidth={1.5} />, title: 'Billing', id: 5, path: '/billing' },
        { icon: <Store size={22} strokeWidth={1.5} />, title: 'Services Menu', id: 14, path: '/services' },
        { icon: <Scissors size={22} strokeWidth={1.5} />, title: 'Hair Extensions', id: 24, path: '/hair-extensions' },
        { icon: <Database size={22} strokeWidth={1.5} />, title: 'Cloud Migration', id: 99, path: '/migrate' },
        { icon: <Settings size={22} strokeWidth={1.5} />, title: 'Settings', id: 6, path: '/settings' },
      ]
    } else if (userType === 'manager') {
      return [
        dashboardItem,
        { icon: <CalendarCheck size={22} strokeWidth={1.5} />, title: 'Appointments', id: 30, path: '/appointments' },
        { icon: <CalendarCheck size={22} strokeWidth={1.5} />, title: 'Attendance', id: 10, path: '/manager/attendance' },
        { icon: <History size={22} strokeWidth={1.5} />, title: 'Billing History', id: 15, path: '/manager/billing' },
        { icon: <IndianRupee size={22} strokeWidth={1.5} />, title: 'Branch Revenue', id: 11, path: '/manager/revenue' },
        { icon: <TrendingUp size={22} strokeWidth={1.5} />, title: 'Staff Revenue', id: 12, path: '/manager/staffrevenue' },
        customerItem,
        { icon: <Scissors size={22} strokeWidth={1.5} />, title: 'Staff', id: 13, path: '/manager/staff' },
        { icon: <Store size={22} strokeWidth={1.5} />, title: 'Services Menu', id: 14, path: '/manager/services' },
        { icon: <Scissors size={22} strokeWidth={1.5} />, title: 'Hair Extensions', id: 24, path: '/hair-extensions' },
        { icon: <Database size={22} strokeWidth={1.5} />, title: 'Cloud Migration', id: 99, path: '/migrate' },
      ]
    } else {
      // Billing Staff
      return [
        dashboardItem,
        customerItem,
        { icon: <CalendarCheck size={22} strokeWidth={1.5} />, title: 'Appointments', id: 30, path: '/appointments' },
        { icon: <PlusCircle size={22} strokeWidth={1.5} />, title: 'New Billing', id: 20, path: '/newbill' },
        { icon: <History size={22} strokeWidth={1.5} />, title: 'Billing History', id: 21, path: '/history' },
        { icon: <Store size={22} strokeWidth={1.5} />, title: 'Services Menu', id: 14, path: '/services' },
        { icon: <Scissors size={22} strokeWidth={1.5} />, title: 'Hair Extensions', id: 24, path: '/hair-extensions' },
        { icon: <CalendarCheck size={22} strokeWidth={1.5} />, title: 'Attendance', id: 22, path: '/attendance' },
        { icon: <Settings size={22} strokeWidth={1.5} />, title: 'Settings', id: 23, path: '/settings' },
      ]
    }
  }

  const menuItems = getMenuItems()

  const handleMenuClick = (item: any) => {
    setActiveMenu(item.id)
    navigate(item.path)
  }

  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        <LayoutDashboard size={24} />
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      ></div>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>

        {/* Close Button for Mobile Inside Sidebar (Optional, or just click overlay) */}
        {isOpen && (
          <div style={{
            width: '100%', padding: '0 20px 20px',
            color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            Menu
          </div>
        )}

        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-icon ${activeMenu === item.id || location.pathname === item.path ? 'active' : ''}`}
            onClick={() => {
              handleMenuClick(item);
              setIsOpen(false); // Close on click
            }}
            title={item.title} // CSS uses this for ::after content on mobile
            style={{ position: 'relative' }}
          >
            {item.icon}
            <div style={{
              position: 'absolute',
              left: '65px',
              backgroundColor: 'var(--primary-dark)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 0.3s',
              border: '1px solid var(--border-color)',
            }} className="tooltip">
              {item.title}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}