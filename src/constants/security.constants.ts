// Security constants - centralized security values

/**
 * File upload security constants
 */
export const FILE_SECURITY = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] as const,
    documents: ['application/pdf'] as const,
    all: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'] as const
  },
  BLOCKED_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar',
    '.sh', '.bash', '.ps1', '.app', '.deb', '.rpm', '.dmg', '.pkg',
    '.msi', '.dll', '.so', '.dylib', '.php', '.asp', '.jsp'
  ] as const
}

/**
 * Password security constants (OWASP compliant)
 */
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{};\':"|,.<>?/~`',
  COMMON_PASSWORDS: [
    'password', '12345678', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ] as const
}

/**
 * Session security constants
 */
export const SESSION_SECURITY = {
  TIMEOUT_MS: 60 * 60 * 1000, // 1 hour
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  REFRESH_BEFORE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  MAX_SESSIONS_PER_USER: 5
}

/**
 * Rate limiting constants
 */
export const RATE_LIMITS = {
  LOGIN: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    LOCKOUT_MS: 15 * 60 * 1000
  },
  SIGNUP: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000 // 1 hour
  },
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000 // 1 hour
  },
  API_CALL: {
    MAX_ATTEMPTS: 60,
    WINDOW_MS: 60 * 1000 // 1 minute
  },
  FILE_UPLOAD: {
    MAX_ATTEMPTS: 10,
    WINDOW_MS: 60 * 1000 // 1 minute
  }
}

/**
 * Input validation constants
 */
export const INPUT_LIMITS = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  EMAIL: {
    MAX_LENGTH: 254,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s'-]+$/
  },
  COURSE_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  NOTE_CONTENT: {
    MAX_LENGTH: 50000 // ~50KB
  },
  SEARCH_QUERY: {
    MAX_LENGTH: 500
  }
}

/**
 * Security headers
 */
export const SECURITY_HEADERS = {
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://meet.jit.si'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://*.supabase.co', 'https://meet.jit.si', 'https://api.pwnedpasswords.com'],
    'frame-src': ["'self'", 'https://meet.jit.si', 'https://*.supabase.co'],
    'media-src': ["'self'", 'blob:', 'https://meet.jit.si'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },
  OTHER_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

/**
 * Allowed redirect URLs (prevent open redirect vulnerabilities)
 */
export const ALLOWED_REDIRECT_DOMAINS = [
  'lucero.app',
  'localhost',
  '127.0.0.1'
] as const

/**
 * Sensitive field names to mask in logs
 */
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'credentials',
  'authorization',
  'cookie',
  'session',
  'ssn',
  'creditCard',
  'cvv'
] as const

/**
 * Error messages (user-friendly, no sensitive info)
 */
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  AUTH_FAILED: 'Authentication failed. Please check your credentials.',
  UNAUTHORIZED: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  INVALID_INPUT: 'Invalid input. Please check your data.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed.',
  INVALID_FILE_TYPE: 'File type not allowed.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  NETWORK_ERROR: 'Network error. Please check your connection.'
}

/**
 * Security event types for logging/monitoring
 */
export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  SESSION_TIMEOUT: 'session_timeout',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  FILE_UPLOAD: 'file_upload',
  DATA_EXPORT: 'data_export',
  ACCOUNT_LOCKED: 'account_locked'
} as const

/**
 * Production environment flags
 */
export const ENVIRONMENT = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_VERBOSE_ERRORS: process.env.NODE_ENV !== 'production'
}
