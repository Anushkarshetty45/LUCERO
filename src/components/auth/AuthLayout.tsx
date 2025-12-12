import { ReactNode } from 'react'
import './AuthLayout.css'
import horseLogo from '../../assets/lucero-new-logo.png'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      {/* Left side - Logo */}
      <div className="auth-logo-section">
        <img src={horseLogo} alt="LUCERO Horse" className="auth-horse-logo" />
        <div className="auth-logo-text">LUCERO</div>
        <p>Your learning journey begins here!</p>
      </div>

      {/* Right side - Form */}
      <div className="auth-form-section">
        {children}
      </div>
    </div>
  )
}
