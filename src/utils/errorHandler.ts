// Secure error handling - prevents information disclosure

/**
 * Error types for classification
 */
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT = 'rate_limit',
  FILE_UPLOAD = 'file_upload'
}

/**
 * Sanitized error messages for users (no sensitive info)
 */
export const USER_FRIENDLY_ERRORS: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION]: 'Authentication failed. Please check your credentials and try again.',
  [ErrorType.AUTHORIZATION]: 'You don\'t have permission to access this resource.',
  [ErrorType.VALIDATION]: 'Invalid input. Please check your data and try again.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER_ERROR]: 'An unexpected error occurred. Our team has been notified.',
  [ErrorType.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorType.FILE_UPLOAD]: 'File upload failed. Please check the file and try again.'
}

/**
 * Sanitize error for user display
 * Removes stack traces, internal paths, and sensitive information
 */
export const sanitizeError = (error: Error | unknown, type: ErrorType = ErrorType.SERVER_ERROR): string => {
  // Never show raw error messages in production
  if (process.env.NODE_ENV === 'production') {
    return USER_FRIENDLY_ERRORS[type]
  }

  // In development, show more details but still sanitize
  if (error instanceof Error) {
    const message = error.message
      .replace(/\/Users\/.*?\//, '.../')  // Remove file paths
      .replace(/at .*?\(.*?\)/g, '')      // Remove stack trace functions
      .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[JWT_TOKEN]')  // Mask JWT
      .replace(/[a-f0-9]{32,}/gi, '[HASH]')  // Mask long hashes
      .slice(0, 200)  // Limit length

    return `[DEV] ${message}`
  }

  return USER_FRIENDLY_ERRORS[type]
}

/**
 * Log error securely (no sensitive data)
 */
export const logError = (
  error: Error | unknown,
  context: Record<string, any> = {},
  errorType: ErrorType = ErrorType.SERVER_ERROR
): void => {
  // Only log in development
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const sanitizedContext = {
    ...context,
    // Remove sensitive fields
    password: undefined,
    token: undefined,
    apiKey: undefined,
    secret: undefined,
    // Add metadata
    timestamp: new Date().toISOString(),
    errorType,
    userAgent: navigator.userAgent
  }

  console.error('🚨 Error:', {
    message: error instanceof Error ? error.message : String(error),
    context: sanitizedContext
  })

  // In production, this would send to error tracking service (Sentry, etc.)
  // Example: Sentry.captureException(error, { contexts: sanitizedContext })
}

/**
 * Handle API errors safely
 */
export const handleAPIError = (error: any): { message: string; type: ErrorType } => {
  // Network errors
  if (!navigator.onLine) {
    return {
      message: USER_FRIENDLY_ERRORS[ErrorType.NETWORK_ERROR],
      type: ErrorType.NETWORK_ERROR
    }
  }

  // HTTP status codes
  if (error.response) {
    const status = error.response.status

    switch (status) {
      case 401:
        return {
          message: USER_FRIENDLY_ERRORS[ErrorType.AUTHENTICATION],
          type: ErrorType.AUTHENTICATION
        }
      case 403:
        return {
          message: USER_FRIENDLY_ERRORS[ErrorType.AUTHORIZATION],
          type: ErrorType.AUTHORIZATION
        }
      case 404:
        return {
          message: USER_FRIENDLY_ERRORS[ErrorType.NOT_FOUND],
          type: ErrorType.NOT_FOUND
        }
      case 422:
        return {
          message: USER_FRIENDLY_ERRORS[ErrorType.VALIDATION],
          type: ErrorType.VALIDATION
        }
      case 429:
        return {
          message: USER_FRIENDLY_ERRORS[ErrorType.RATE_LIMIT],
          type: ErrorType.RATE_LIMIT
        }
      case 500:
      case 502:
      case 503:
        return {
          message: USER_FRIENDLY_ERRORS[ErrorType.SERVER_ERROR],
          type: ErrorType.SERVER_ERROR
        }
      default:
        return {
          message: USER_FRIENDLY_ERRORS[ErrorType.SERVER_ERROR],
          type: ErrorType.SERVER_ERROR
        }
    }
  }

  // Default error
  return {
    message: USER_FRIENDLY_ERRORS[ErrorType.SERVER_ERROR],
    type: ErrorType.SERVER_ERROR
  }
}

/**
 * Safe error boundary component helper
 */
export const getErrorBoundaryMessage = (error: Error): string => {
  if (process.env.NODE_ENV === 'production') {
    return 'Something went wrong. Please refresh the page and try again.'
  }
  return `An error occurred: ${sanitizeError(error)}`
}
