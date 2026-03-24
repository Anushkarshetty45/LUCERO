import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    // Set a maximum loading timeout (5 seconds)
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth check timed out after 5 seconds, proceeding without session')
        setError(new Error('Authentication check timeout'))
        setLoading(false)
      }
    }, 5000)

    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (!mounted) return
        if (sessionError) {
          console.error('Session check error:', sessionError)
          setError(sessionError)
        }
        setUser(session?.user ?? null)
        setLoading(false)
        clearTimeout(timeoutId)
      })
      .catch((err) => {
        if (!mounted) return
        console.error('Failed to get session:', err)
        setError(err)
        setLoading(false)
        clearTimeout(timeoutId)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, error, signOut }
}

