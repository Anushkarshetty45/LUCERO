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
    ADD_ATTR: ['target', 'rel']
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

