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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="auth-form">
      <h2>Welcome Back</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="lucero@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="forgot-password">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="divider">or continue with</div>

      <div className="social-auth">
        <button onClick={handleGoogleSignIn} className="btn-social">
          <img src="/google-icon.svg" alt="Google" /> Google
        </button>
      </div>

      <p className="toggle-form">
        Don't have an account? <button onClick={onToggle}>Sign up</button>
      </p>
    </div>
  )
}

