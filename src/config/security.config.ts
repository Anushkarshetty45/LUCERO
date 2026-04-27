// Security configuration constants for LUCERO
// Centralized security settings

export const SECURITY_CONFIG = {
  // File Upload Limits
  MAX_FILE_SIZE_MB: parseInt(process.env.REACT_APP_MAX_FILE_SIZE_MB || '10'),
  ALLOWED_FILE_TYPES: {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf'],
    all: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  },

  // Rate Limiting
  RATE_LIMITS: {
    login: { maxAttempts: 5, windowMs: 900000 }, // 15 minutes
    signup: { maxAttempts: 3, windowMs: 3600000 }, // 1 hour
    api: { maxAttempts: 60, windowMs: 60000 }, // 1 minute
    passwordReset: { maxAttempts: 3, windowMs: 3600000 } // 1 hour
  },

  // Session Management
  SESSION_TIMEOUT_MS: parseInt(process.env.REACT_APP_SESSION_TIMEOUT_MINUTES || '60') * 60 * 1000,
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes

  // Password Requirements
  PASSWORD: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
    commonPasswords: ['password', '12345678', 'qwerty', 'abc123', 'password123']
  },

  // Content Security
  ALLOWED_DOMAINS: ['lucero.app', 'supabase.co', 'googleapis.com'],
  TRUSTED_ORIGINS: [
    process.env.REACT_APP_URL || 'http://localhost:3000',
    'https://lucero.app',
    'https://*.lucero.app'
  ],

  // API Security
  API_KEY_HEADER: 'X-API-Key',
  CSRF_TOKEN_HEADER: 'X-CSRF-Token',

  // Logging
  LOG_SENSITIVE_DATA: process.env.NODE_ENV !== 'production',
  MASK_PII: true
}

export const CONTENT_SECURITY_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React
    "'unsafe-eval'", // Required for development
    'https://meet.jit.si',
    'https://generativelanguage.googleapis.com'
  ],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://generativelanguage.googleapis.com',
    'https://meet.jit.si',
    'https://api.pwnedpasswords.com'
  ],
  'frame-src': [
    "'self'",
    'https://meet.jit.si',
    'https://*.supabase.co'
  ],
  'media-src': ["'self'", 'blob:', 'https://meet.jit.si'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
}

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}
