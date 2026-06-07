import DOMPurify from 'dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Use this for any user-generated or AI-generated content before rendering
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
      'ul', 'ol', 'li',
      'code', 'pre',
      'blockquote', 'q',
      'a',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'main',
      'hr', 'abbr', 'cite', 'time'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id',
      'title', 'alt', 'datetime', 'colspan', 'rowspan'
    ],
    ADD_ATTR: ['target', 'rel'],
    ALLOWED_URI_REGEXP: /^https?:\/\//i,
  })
}

export const sanitizeNotes = (dirty: string): string => {
  return sanitizeHTML(dirty)
}

export const sanitizeUserInput = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

export const stripHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

/**
 * Validate file upload security
 * @param file - File object to validate
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export const validateFileUpload = (
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
): { valid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed` }
  }

  // Check for malicious file names
  const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.sh$/i, /\.cmd$/i, /\.\./]
  if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
    return { valid: false, error: 'File name contains dangerous patterns' }
  }

  return { valid: true }
}

/**
 * Sanitize input to prevent injection attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

/**
 * Validate email format securely
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  if (email.length > 254) {
    return { valid: false, error: 'Email too long' }
  }
  return { valid: true }
}

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) return '****'
  return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars)
}

/**
 * Rate limiter using localStorage
 */
export const checkRateLimit = (
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remainingAttempts: number } => {
  const now = Date.now()
  const storageKey = `ratelimit_${key}`

  try {
    const stored = localStorage.getItem(storageKey)
    const data = stored ? JSON.parse(stored) : { attempts: [] }

    data.attempts = data.attempts.filter((timestamp: number) => now - timestamp < windowMs)

    if (data.attempts.length >= maxAttempts) {
      return { allowed: false, remainingAttempts: 0 }
    }

    data.attempts.push(now)
    localStorage.setItem(storageKey, JSON.stringify(data))

    return { allowed: true, remainingAttempts: maxAttempts - data.attempts.length }
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts }
  }
}

