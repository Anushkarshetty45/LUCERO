import { useState } from 'react'
import { supabase } from '../../services/supabase'
import './AuthForms.css'

export default function LoginForm({ onToggle }: { onToggle: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) { setError(error.message); setLoading(false) }
    } catch {
      setError('Failed to connect. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <h2>Welcome <span style={{ color: 'var(--accent-primary)' }}>back</span></h2>
      <p className="auth-subtitle">Sign in to continue your learning journey</p>

      {error && <div className="error-message">{error}</div>}

      <div className="social-auth social-auth-vertical">
        <button onClick={handleGoogle} className="btn-social btn-social-full" disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{loading ? 'Redirecting...' : 'Continue with Google'}</span>
        </button>
      </div>

      <p className="toggle-form">
        New user? <button onClick={onToggle}>Sign up</button>
      </p>

      <p className="auth-terms">
        By continuing, you agree to our{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Use</a>
        {' '}and{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
      </p>
    </div>
  )
}
