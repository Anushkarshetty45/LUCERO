import i18next from 'i18next'

// Get personalized greeting based on time
export const getGreeting = (firstName: string): string => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return `${(i18next.t as any)('dashboard.greeting.morning')}, ${firstName}! `
  } else if (hour >= 12 && hour < 17) {
    return `${(i18next.t as any)('dashboard.greeting.afternoon')}, ${firstName}! `
  } else if (hour >= 17 && hour < 22) {
    return `${(i18next.t as any)('dashboard.greeting.evening')}, ${firstName}! `
  } else {
    return `${(i18next.t as any)('dashboard.greeting.lateNight', { name: firstName })} `
  }
}

// Format seconds to readable time
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Format date to readable format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return (i18next.t as any)('common.today')
  if (diffDays === 1) return (i18next.t as any)('common.yesterday')
  if (diffDays < 7) return (i18next.t as any)('common.daysAgo', { count: diffDays })

  return date.toLocaleDateString(i18next.language, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Calculate streak days (mock for now, you can enhance this)
export const calculateStreak = (): number => {
  // For now, return a random streak
  // Later, calculate based on study_sessions data
  return 5
}

// Get daily motivational quote (persists for the entire day)
export const getMotivationalQuote = (): string => {
  const quoteKeys = [
    'dashboard.quotes.crush',
    'dashboard.quotes.today',
    'dashboard.quotes.future',
    'dashboard.quotes.keepGoing',
    'dashboard.quotes.journey',
    'dashboard.quotes.beginner',
    'dashboard.quotes.progress',
    'dashboard.quotes.goals'
  ]

  // Get today's date string (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0]
  const currentLanguage = i18next.language

  // Check localStorage for today's quote
  const stored = localStorage.getItem('dailyQuote')
  if (stored) {
    try {
      const { date, quoteKey, language } = JSON.parse(stored)
      // Return stored quote only if it's for today and same language
      if (date === today && language === currentLanguage) {
        return (i18next.t as any)(quoteKey)
      }
    } catch (e) {
      // Invalid stored data, generate new quote
    }
  }

  // Generate new quote for today
  const newQuoteKey = quoteKeys[Math.floor(Math.random() * quoteKeys.length)]
  localStorage.setItem('dailyQuote', JSON.stringify({
    date: today,
    quoteKey: newQuoteKey,
    language: currentLanguage
  }))
  return (i18next.t as any)(newQuoteKey)
}
// Get color for course (cycle through colors)
export const getCourseColor = (index: number): string => {
  const colors = [
    '#6C5CE7', // Purple
    '#0984E3', // Blue
    '#00B894', // Green
    '#FDCB6E', // Yellow
    '#E17055', // Orange
    '#FD79A8', // Pink
    '#A29BFE', // Light Purple
    '#74B9FF'  // Light Blue
  ]

  return colors[index % colors.length]
}