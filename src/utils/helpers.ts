// Get personalized greeting based on time
export const getGreeting = (firstName: string): string => {
    const hour = new Date().getHours()
    
    if (hour >= 5 && hour < 12) {
      return `Good morning, ${firstName}! ☀️`
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${firstName}! 📚`
    } else if (hour >= 17 && hour < 22) {
      return `Good evening, ${firstName}! 🌙`
    } else {
      return `Burning the midnight oil, ${firstName}? 🔥`
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
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  // Calculate streak days (mock for now, you can enhance this)
  export const calculateStreak = (): number => {
    // For now, return a random streak
    // Later, calculate based on study_sessions data
    return 5
  }
  
  // Get random motivational quote
  export const getMotivationalQuote = (): string => {
    const quotes = [
      "Ready to crush it?",
      "Let's make today count!",
      "Your future self will thank you!",
      "Keep going, you're doing great!",
      "Learning is a journey, enjoy the ride!",
      "Every expert was once a beginner!",
      "Progress, not perfection!",
      "You're one step closer to your goals!"
    ]
    
    return quotes[Math.floor(Math.random() * quotes.length)]
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