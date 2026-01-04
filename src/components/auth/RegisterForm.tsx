import { useState } from 'react'
import { supabase } from '../../services/supabase'

import './AuthForms.css'

export default function RegisterForm({ onToggle }: { onToggle: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [subscribe, setSubscribe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

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

      // Step 1: Create user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`
          }
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

      // Step 2: Send OTP to email
      console.log('📧 Sending OTP to email...')
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      })

      if (otpError) {
        console.error('❌ OTP send error:', otpError)

        // Handle rate limiting specifically
        if (otpError.message.toLowerCase().includes('only request this after')) {
          // Extract wait time from error message
          const match = otpError.message.match(/after (\d+) seconds?/)
          const waitTime = match ? match[1] : '60'

          setError(`⏱️ Too many requests. Please wait ${waitTime} seconds before requesting a new OTP, or try logging in directly.`)
        } else {
          setError('✅ Account created! However, we couldn\'t send the OTP. You can try logging in - your email may already be verified, or request a password reset.')
        }

        setLoading(false)

        // Auto-switch to login after 3 seconds
        setTimeout(() => {
          if (window.confirm('Your account was created successfully!\n\nWould you like to go to the login page now?')) {
            onToggle()
          }
        }, 2000)

        return
      }

      console.log('✅ OTP sent successfully!')
      setLoading(false)
      setShowOtpInput(true)

    } catch (err: any) {
      console.error('💥 Unexpected error:', err)
      setError(err?.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setOtpLoading(true)
    setError('')

    try {
      console.log('🔐 Verifying OTP...')

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (error) {
        console.error('❌ OTP verification error:', error)

        // Handle specific OTP error cases
        let errorMessage = error.message

        if (error.message.toLowerCase().includes('invalid') ||
            error.message.toLowerCase().includes('expired') ||
            error.message.toLowerCase().includes('token')) {
          errorMessage = '⚠️ Invalid or expired OTP code. Please check the code or request a new one.'
        } else if (error.message.toLowerCase().includes('too many')) {
          errorMessage = '⚠️ Too many attempts. Please wait a moment and try again.'
        }

        setError(errorMessage)
        setOtpLoading(false)
        return
      }

      console.log('✅ OTP verified successfully!')

      // Sign out the user so they can log in properly
      await supabase.auth.signOut()

      setOtpLoading(false)
      alert(`✅ Email verified successfully!\n\nYou can now log in with your credentials.`)
      onToggle() // Switch to login form

    } catch (err: any) {
      console.error('💥 OTP verification error:', err)
      setError(err?.message || 'Failed to verify OTP. Please try again.')
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      })

      if (error) {
        setError('Failed to resend OTP. Please try again.')
      } else {
        alert('✅ New OTP sent to your email!')
      }
    } catch (err: any) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
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
      <h2>{showOtpInput ? 'Verify Your Email' : 'Create Account'}</h2>

      {error && <div className="error-message">{error}</div>}

      {showOtpInput ? (
        // OTP Verification Form
        <div className="otp-verification">
          <p className="otp-message">
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>
          <p className="otp-submessage">Please check your email and enter the code below</p>

          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Enter OTP Code</label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className="otp-input"
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary" disabled={otpLoading}>
              {otpLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="otp-resend">
            <p>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              className="btn-link"
              disabled={loading}
            >
              Resend OTP
            </button>
          </div>
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
