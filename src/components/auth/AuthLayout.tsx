import React from 'react'
import './AuthLayout.css'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{title}</h1>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        <div className="auth-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

