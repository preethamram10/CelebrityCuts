import { LogOut } from 'lucide-react'

interface HeaderProps {
  title: string
  onLogout: () => void
}

export default function Header({ title, onLogout }: HeaderProps) {
  return (
    <div className="header">
      <h1 className="logo">{title}</h1>
      <div className="header-right">
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button className="logout-button" onClick={onLogout}>
          <LogOut size={16} style={{ display: 'inline', marginRight: '5px' }} />
          Logout
        </button>
      </div>
    </div>
  )
}
