import { useEffect } from 'react'
import { CONTENT_SECURITY_POLICY } from '../config/security.config'

/**
 * Hook to apply security headers (client-side meta tags)
 * Note: Proper security headers should be set server-side
 */
export const useSecurityHeaders = () => {
  useEffect(() => {
    // Content Security Policy meta tag
    const cspContent = Object.entries(CONTENT_SECURITY_POLICY)
      .map(([directive, sources]) => {
        if (Array.isArray(sources) && sources.length > 0) {
          return `${directive} ${sources.join(' ')}`
        }
        return directive
      })
      .join('; ')

    let metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (!metaCSP) {
      metaCSP = document.createElement('meta')
      metaCSP.setAttribute('http-equiv', 'Content-Security-Policy')
      document.head.appendChild(metaCSP)
    }
    metaCSP.setAttribute('content', cspContent)

    // X-Content-Type-Options
    let metaContentType = document.querySelector('meta[http-equiv="X-Content-Type-Options"]')
    if (!metaContentType) {
      metaContentType = document.createElement('meta')
      metaContentType.setAttribute('http-equiv', 'X-Content-Type-Options')
      metaContentType.setAttribute('content', 'nosniff')
      document.head.appendChild(metaContentType)
    }

    // Referrer Policy
    let metaReferrer = document.querySelector('meta[name="referrer"]')
    if (!metaReferrer) {
      metaReferrer = document.createElement('meta')
      metaReferrer.setAttribute('name', 'referrer')
      metaReferrer.setAttribute('content', 'strict-origin-when-cross-origin')
      document.head.appendChild(metaReferrer)
    }
  }, [])
}
