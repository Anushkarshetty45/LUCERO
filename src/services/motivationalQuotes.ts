// Motivational quotes for daily emails
export const motivationalQuotes = [
  "Every expert was once a beginner. Keep learning!",
  "Success is the sum of small efforts repeated day in and day out.",
  "The secret to getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Believe you can and you're halfway there.",
  "Your future self will thank you for the effort you put in today.",
  "Small daily improvements lead to stunning results.",
  "Education is the passport to the future.",
  "The only way to do great work is to love what you do.",
  "Learning is a treasure that will follow its owner everywhere.",
  "You are capable of more than you know. Keep pushing!",
  "Every day is a new opportunity to learn and grow.",
  "The best investment you can make is in yourself.",
  "Knowledge is power. Use it wisely!",
  "Your dedication today shapes your success tomorrow.",
  "Stay focused, stay positive, stay strong!",
  "The journey of a thousand miles begins with a single step.",
  "You don't have to be great to start, but you have to start to be great.",
  "Learning never exhausts the mind.",
  "The more that you read, the more things you will know.",
  "An investment in knowledge pays the best interest.",
  "The expert in anything was once a beginner.",
  "Success doesn't come from what you do occasionally, it comes from what you do consistently.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction."
]

export function getRandomMotivationalQuote(): string {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
}

export function getDailyQuote(date: Date = new Date()): string {
  // Use the day of year to get a consistent quote for the day
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
  return motivationalQuotes[dayOfYear % motivationalQuotes.length]
}
