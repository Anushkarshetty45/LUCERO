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

// Log configuration (masked key for security)
console.log('Supabase Config:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
})

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
  console.log('Auth state changed:', event, {
    hasSession: !!session,
    userId: session?.user?.id,
    userEmail: session?.user?.email
  })
})

