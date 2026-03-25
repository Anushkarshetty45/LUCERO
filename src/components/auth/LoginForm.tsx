import { useState } from 'react'
import { supabase } from '../../services/supabase'
import { Link } from 'react-router-dom'
import './AuthForms.css'

export default function LoginForm({ onToggle }: { onToggle: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!email.trim()) {
      setError('⚠️ Please enter your email address.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('⚠️ Please enter a valid email address.')
      return
    }

    if (!password) {
      setError('⚠️ Please enter your password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Handle specific error cases with user-friendly messages
        let errorMessage = error.message

        if (error.message.toLowerCase().includes('invalid login credentials') ||
            error.message.toLowerCase().includes('invalid email or password')) {
          errorMessage = '⚠️ Invalid email or password. Please check your credentials and try again.'
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          errorMessage = '⚠️ Please verify your email before logging in. Check your inbox for the verification link.'
        } else if (error.message.toLowerCase().includes('user not found')) {
          errorMessage = '⚠️ No account found with this email. Please sign up first.'
        } else if (error.message.toLowerCase().includes('too many requests')) {
          errorMessage = '⚠️ Too many login attempts. Please wait a moment and try again.'
        } else if (error.message.toLowerCase().includes('network') ||
                   error.message.toLowerCase().includes('fetch')) {
          errorMessage = '⚠️ Network error. Please check your connection and try again.'
        }

        setError(errorMessage)
        setLoading(false)
      } else {
        // Force redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      }
    } catch (err: any) {
      // Security: Don't log sensitive error details in production
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      if (error) {
        console.error('Google OAuth error:', error)
        setError('⚠️ ' + error.message)
        setLoading(false)
      }
      // Don't set loading to false on success - redirect happens
    } catch (err: any) {
      console.error('OAuth initialization error:', err)
      setError('⚠️ Failed to initialize Google sign-in. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '16px', fontSize: '16px' }}
          />
        </div>

        <div className="form-group">
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '16px', fontSize: '16px' }}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '16px' }}>
          {loading ? 'Signing in...' : 'Log in'}
        </button>
      </form>

      <div className="forgot-password" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Forgot your password?</span>{' '}
        <Link to="/forgot-password" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Reset password</Link>
      </div>

      <div className="divider">or continue with</div>

      <div className="social-auth">
        <button onClick={handleGoogleSignIn} className="btn-social" disabled={loading}>
          <img src="/google-icon.svg" alt="Google" /> Google
        </button>
      </div>

      <p className="toggle-form">
        Don't have an account? <button onClick={onToggle}>Sign Up</button>
      </p>
    </div>
  )
}

