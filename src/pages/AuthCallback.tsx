import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingScreen from '../components/LoadingScreen'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          setError('Authentication failed: ' + sessionError.message)
          setTimeout(() => navigate('/auth?error=oauth_failed'), 2000)
          return
        }

        if (!session) {
          setError('No authentication session found. Please try signing in again.')
          setTimeout(() => navigate('/auth'), 2000)
          return
        }

        navigate('/dashboard')
      } catch (err: any) {
        setError('An unexpected error occurred. Please try again.')
        setTimeout(() => navigate('/auth?error=oauth_failed'), 2000)
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '32px',
          borderRadius: '16px',
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Authentication Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
            {error}
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Redirecting to login page...
          </p>
        </div>
      </div>
    )
  }

  return <LoadingScreen />
}
