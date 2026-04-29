// Security middleware for client-side protection

import { checkRateLimit } from '../utils/security'
import { ErrorType, logError } from '../utils/errorHandler'

/**
 * Rate limiting middleware
 */
export const withRateLimit = <T extends (...args: any[]) => any>(
  fn: T,
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): T => {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const rateLimit = checkRateLimit(key, maxAttempts, windowMs)

    if (!rateLimit.allowed) {
      logError(
        new Error(`Rate limit exceeded for ${key}`),
        { key, maxAttempts, windowMs },
        ErrorType.RATE_LIMIT
      )
      throw new Error('Too many requests. Please try again later.')
    }

    return fn(...args)
  }) as T
}

/**
 * Input sanitization middleware
 */
export const withInputSanitization = <T extends (...args: any[]) => any>(
  fn: T,
  sanitize: (input: any) => any
): T => {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return sanitize(arg)
      }
      if (typeof arg === 'object' && arg !== null) {
        return Object.fromEntries(
          Object.entries(arg).map(([key, value]) =>
            [key, typeof value === 'string' ? sanitize(value) : value]
          )
        )
      }
      return arg
    })

    return fn(...sanitizedArgs)
  }) as T
}

/**
 * Authentication check middleware
 */
export const withAuth = <T extends (...args: any[]) => any>(
  fn: T,
  checkAuth: () => boolean
): T => {
  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!checkAuth()) {
      throw new Error('Authentication required')
    }
    return fn(...args)
  }) as T
}

/**
 * Error boundary middleware
 */
export const withErrorBoundary = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error) => void
): T => {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (errorHandler) {
        errorHandler(error as Error)
      } else {
        logError(error, { function: fn.name })
      }
      throw error
    }
  }) as T
}

/**
 * Debounce middleware for preventing spam
 */
export const withDebounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T => {
  let timeoutId: NodeJS.Timeout | null = null

  return ((...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }) as any
}

/**
 * Prevent concurrent execution
 */
export const withMutex = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => {
  let isExecuting = false

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (isExecuting) {
      throw new Error('Function is already executing')
    }

    isExecuting = true
    try {
      return await fn(...args)
    } finally {
      isExecuting = false
    }
  }) as T
}
