import { ReactNode } from 'react'
import './AuthLayout.css'
import luceroLogo from '../../assets/lucero-logo.png'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      <div className="auth-form-section">
        <div className="auth-logo">
          <img src={luceroLogo} alt="LUCERO" />
          <p>Your learning journey begins here!</p>
        </div>
        {children}
      </div>
    </div>
  )
}
