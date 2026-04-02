import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase configuration missing!')
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING')
  throw new Error('Supabase URL or Anonymous Key is not configured. Please check your .env file.')
}

// Log configuration only in development (never log keys in production)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase Config:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    environment: process.env.NODE_ENV
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,  // Critical for OAuth callback handling
    flowType: 'pkce'  // More secure OAuth flow (Proof Key for Code Exchange)
  }
})

// Add global error handler for debugging auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  // Only log detailed info in development to protect user privacy
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth state changed:', event, {
      hasSession: !!session,
      userId: session?.user?.id
      // Never log email or other PII even in development
    })
  }
})

