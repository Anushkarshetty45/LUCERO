import { useState } from 'react'
import { supabase } from '../../services/supabase'

import './AuthForms.css'

interface RegisterFormProps {
  onToggle: () => void
  selectedPlan: 'free' | 'pro'
}

export default function RegisterForm({ onToggle, selectedPlan }: RegisterFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [subscribe, setSubscribe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🚀 Starting registration...')

    // Client-side validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('⚠️ Please enter your first and last name.')
      return
    }

    if (!email.trim()) {
      setError('⚠️ Please enter your email address.')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('⚠️ Please enter a valid email address.')
      return
    }

    if (!password || password.length < 6) {
      setError('⚠️ Password must be at least 6 characters long.')
      return
    }

    if (!acceptTerms) {
      setError('⚠️ Please accept the Terms of Use and Privacy Policy to continue.')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('📧 Signing up with email:', email)

      // Create user account - Supabase will send confirmation email automatically
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            subscription_plan: selectedPlan
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      console.log('📦 Signup response:', { data, error })

      if (error) {
        console.error('❌ Signup error:', error)

        // Handle specific error cases with user-friendly messages
        let errorMessage = error.message

        if (error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already exists') ||
            error.message.toLowerCase().includes('user already registered')) {
          errorMessage = '⚠️ This email is already registered. Please use a different email or try logging in.'
        } else if (error.message.toLowerCase().includes('invalid email')) {
          errorMessage = '⚠️ Please enter a valid email address.'
        } else if (error.message.toLowerCase().includes('password')) {
          errorMessage = '⚠️ Password must be at least 6 characters long.'
        } else if (error.message.toLowerCase().includes('network') ||
                   error.message.toLowerCase().includes('fetch')) {
          errorMessage = '⚠️ Network error. Please check your connection and try again.'
        } else if (error.message.toLowerCase().includes('rate limit')) {
          errorMessage = '⚠️ Too many requests. Please wait a moment and try again.'
        }

        setError(errorMessage)
        setLoading(false)
        return
      }

      console.log('✅ Signup successful!')
      console.log('👤 User:', data.user?.email)

      // Check if email confirmation is disabled (auto-confirmed)
      if (data.user && data.user.confirmed_at) {
        console.log('✅ Email auto-confirmed, redirecting to dashboard...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        console.log('📧 Confirmation email sent')
        setSuccess(true)
      }

      setLoading(false)

    } catch (err: any) {
      console.error('💥 Unexpected error:', err)
      setError(err?.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }


  const handleGoogleSignUp = async () => {
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
      <h2>{success ? 'Check Your Email' : 'Create Account'}</h2>

      {error && <div className="error-message">{error}</div>}

      {success ? (
        // Success - Check Email
        <div className="success-container" style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📧</div>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Account Created!</h3>
          <p style={{ marginBottom: '24px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            We've sent a confirmation link to<br />
            <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong>
          </p>
          <div style={{
            padding: '20px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.8' }}>
              <strong>Next steps:</strong><br />
              1. Check your inbox for the confirmation email<br />
              2. Click the confirmation link<br />
              3. You'll be automatically logged in to your dashboard
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={onToggle}
            style={{ width: '100%', marginBottom: '12px' }}
          >
            Back to Login
          </button>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Didn't receive the email? Check your spam folder.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              placeholder="Luna"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              placeholder="Quinn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

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
              minLength={6}
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

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            I accept{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms of Use
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </label>
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={subscribe}
              onChange={(e) => setSubscribe(e.target.checked)}
            />
            Keep me up to date with new features & promotions
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Get started'}
        </button>
      </form>

      <div className="divider">or continue with</div>

      <div className="social-auth">
        <button onClick={handleGoogleSignUp} className="btn-social">
          <img src="/google-icon.svg" alt="Google" /> Google
        </button>
      </div>

      <p className="toggle-form">
        Already have an account? <button onClick={onToggle}>Log in</button>
      </p>
        </>
      )}
    </div>
  )
}
