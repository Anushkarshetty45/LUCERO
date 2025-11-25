import { useState } from 'react'
import { supabase } from '../../services/supabase'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 Starting registration...')
    
    if (!acceptTerms) {
      setError('Please accept the terms of use')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('📧 Signing up with email:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`
          },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      })

      console.log('📦 Signup response:', { data, error })

      if (error) {
        console.error('❌ Signup error:', error)
        setError(error.message)
        setLoading(false)
      } else {
        console.log('✅ Signup successful!')
        console.log('👤 User:', data.user?.email)
        
        // ALWAYS require email confirmation before login
        console.log('📧 Email verification required')
        setLoading(false)
        alert(`✅ Registration successful!\n\n📧 Please check your email (${email}) to verify your account.\n\nAfter verification, you can log in.`)
        onToggle() // Switch to login form
      }
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
      <h2>Create Account</h2>
      
      {error && <div className="error-message">{error}</div>}

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
    </div>
  )
}
