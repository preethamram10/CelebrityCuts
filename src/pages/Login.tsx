import React, { useState } from 'react'
import { authService, User } from '../services/authService'

interface LoginProps {
  onLogin: (user: User) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }
    try {
      const user = await authService.login(username, password)

      if (user) {
        onLogin(user)
      } else {
        setError('Invalid credentials')
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || 'An error occurred during login. Please check your internet or database connection.')
    }
  }
  // Define Eye Icons locally to avoid dependency issues if lucide-react isn't fully set up or to keep it simple
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.44 0 .87-.03 1.28-.09" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Celebrity Cuts CRM</h1>
        <p className="login-subtitle">Salon Management System</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
          <button
            type="submit"
            className="login-button"
            style={{ width: '100%', marginTop: '10px' }}
          >
            Sign In
          </button>

          {/* Quick Branch Login Helper */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #282828', paddingTop: '15px' }}>
            <details style={{ cursor: 'pointer', color: '#888', fontSize: '12px' }}>
              <summary style={{ outline: 'none', userSelect: 'none', color: '#c5a059', fontWeight: 600 }}>
                🔑 View Branch Credentials (1-Click Fill)
              </summary>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => { setUsername('Admin'); setPassword('Nag@123'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  👑 <strong>Super Admin:</strong> Admin / Nag@123
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('branchmanager1'); setPassword('madbranch1@123'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  🏢 <strong>Main Manager (Madhuravada):</strong> branchmanager1 / madbranch1@123
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('branch1'); setPassword('bill1'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  🧾 <strong>Main Billing (Madhuravada):</strong> branch1 / bill1
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('Vizag12'); setPassword('Vizag12'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  🏢 <strong>Vizag Manager:</strong> Vizag12 / Vizag12
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('branch2'); setPassword('bill2'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  🧾 <strong>Vizag Billing:</strong> branch2 / bill2
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('branchmanager3'); setPassword('madbranch3@123'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  🏢 <strong>Vijayawada Manager:</strong> branchmanager3 / madbranch3@123
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('branch3'); setPassword('bill3'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  🧾 <strong>Vijayawada Billing:</strong> branch3 / bill3
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('branch4'); setPassword('hydbranch4'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  🏢 <strong>Hyderabad Manager:</strong> branch4 / hydbranch4
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('branch4'); setPassword('branch4'); }}
                  style={{ background: '#1c1c1c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', cursor: 'pointer' }}
                >
                  🧾 <strong>Hyderabad Billing:</strong> branch4 / branch4
                </button>
              </div>
            </details>
          </div>
        </form>
      </div>
    </div>
  )
}