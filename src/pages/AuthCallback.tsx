import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingScreen from '../components/LoadingScreen'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        console.log('OAuth callback - processing authentication...')

        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        console.log('Session data:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: sessionError?.message
        })

        if (sessionError) {
          console.error('OAuth callback error:', sessionError)
          setError('Authentication failed: ' + sessionError.message)
          setTimeout(() => navigate('/auth?error=oauth_failed'), 2000)
          return
        }

        if (!session) {
          console.warn('No session found in OAuth callback')
          setError('No authentication session found')
          setTimeout(() => navigate('/auth'), 2000)
          return
        }

        // Check if profile was created successfully
        console.log('Checking profile creation for user:', session.user.id)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('Profile check:', {
          hasProfile: !!profile,
          error: profileError?.message
        })

        if (profileError) {
          console.error('Profile check error:', profileError)
          // Profile creation might have failed due to trigger issues
          setError('Profile creation failed. Please contact support.')
          setTimeout(() => navigate('/auth?error=profile_creation_failed'), 3000)
          return
        }

        // Check if profile needs completion (missing first/last name)
        if (!profile.first_name || !profile.last_name) {
          console.log('Profile incomplete - user may need to complete profile later')
          // For now, just redirect to dashboard (user can complete profile later)
        }

        // Success - redirect to dashboard
        console.log('OAuth callback successful - redirecting to dashboard')
        navigate('/dashboard')

      } catch (err: any) {
        console.error('Error handling OAuth callback:', err)
        console.error('Error details:', {
          message: err?.message,
          name: err?.name,
          stack: err?.stack
        })
        setError('An unexpected error occurred: ' + (err?.message || 'Unknown error'))
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
