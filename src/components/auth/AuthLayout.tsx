import { ReactNode } from 'react'
import './AuthLayout.css'
import luceroLogo from '../../assets/lucero-logo.png'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      {/* Left side - Logo */}
      <div className="auth-logo-section">
        <img src={luceroLogo} alt="LUCERO" />
        <p>Your learning journey begins here!</p>
      </div>
      
      {/* Right side - Form */}
      <div className="auth-form-section">
        {children}
      </div>
    </div>
  )
}
