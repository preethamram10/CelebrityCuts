import { LogOut } from 'lucide-react'
import { authService } from '../services/authService'

interface HeaderWithLogoProps {
  title?: string
  onLogout?: () => void
  showLogout?: boolean
}

// @ts-ignore
import logoSrc from '../Assetss/Logo.png'

export default function HeaderWithLogo({
  title = 'Billing Staff Dashboard',
  onLogout = () => { },
  showLogout = true,
}: HeaderWithLogoProps) {
  const currentUser = authService.getCurrentUser();
  const branchBadge = currentUser?.branchName || 'Staff Portal';

  const today = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header
      style={{
        backgroundColor: 'var(--primary-dark)',
        borderBottom: '2px solid var(--accent-gold)',
        padding: '10px 24px', // Increased padding slightly
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '70px', // Increased height
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          alignItems: 'center',
          gap: 20,
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 12 }}>
          <img
            src={logoSrc}
            alt="Celebrity Cuts Logo"
            style={{
              height: 52, // Increased size
              width: 'auto',
              objectFit: 'contain'
            }}
          />
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-gray)', textTransform: 'uppercase' }}>
              Celebrity Cuts
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-light)' }}>Professional Salon Brand</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '0', borderTop: 'none', borderBottom: 'none' }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              color: 'var(--text-gray)',
              textTransform: 'uppercase',
              marginBottom: 0,
            }}
          >
            Celebrity Cuts
          </div>
          <h1
            style={{
              color: 'var(--accent-gold)',
              fontSize: 22, // Increased font size
              fontWeight: 700,
              margin: 0,
              textShadow: '0 2px 8px rgba(212, 175, 55, 0.35)',
            }}
          >
            {title}
          </h1>
          <p style={{ margin: '2px 0 0', color: '#E4D8B4', fontSize: 11, letterSpacing: 1 }}>
            Professional Salon Management System
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right', color: 'var(--text-light)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-gold)' }}>📍 {branchBadge}</div>
            <div style={{ fontSize: 10, color: 'var(--text-gray)' }}>{today}</div>
          </div>

          {showLogout && (
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid var(--accent-gold)',
                borderRadius: '6px',
                color: 'var(--accent-gold)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--accent-gold)'
                e.currentTarget.style.color = 'var(--primary-dark)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'
                e.currentTarget.style.color = 'var(--accent-gold)'
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
