import { ReactNode } from 'react'
import './AuthLayout.css'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      <div className="auth-form-section">
        <div className="auth-logo">
          <h1>LUCERO</h1>
        </div>
        {children}
      </div>
      <div className="auth-illustration-section">
        {/* You can add your own illustration here */}
        <div className="illustration-placeholder">
          <h2>Welcome to LUCERO</h2>
          <p>Your learning journey starts here!</p>
        </div>
      </div>
    </div>
  )
}
