import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscription } from '../hooks/useSubscription'
import './ChatbotModal.css'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface ChatbotModalProps {
    onClose: () => void
}

// System prompt with LUCERO app knowledge
const LUCERO_SYSTEM_PROMPT = `You are LUCERO AI, a friendly and helpful study assistant built into the LUCERO learning platform. You're enthusiastic, supportive, and always ready to help students succeed!

**Your Personality:**
- Warm, encouraging, and approachable
- Use friendly emojis occasionally to make conversations fun
- Celebrate student achievements and progress
- Provide clear, concise, and SPECIFIC answers
- Be proactive - give direct information instead of generic guidance
- Ask follow-up questions to understand student needs better

**What you know about LUCERO:**

**Core Features:**
1. **Courses & Lessons** - Students can create custom courses, add lessons with content, and track their progress
2. **Study Timer** - Pomodoro-style timer to track study sessions and build focus
3. **Notes** - Take and organize notes for each course with topics
4. **Flashcards** - Create and study flashcards for any course to improve memorization
5. **PDF Analyzer** - Upload PDFs to analyze, generate summaries, flashcards, quizzes, and mind maps
6. **Group Study** - Video call feature to study together with friends using meeting codes
7. **Live Study** - Stream your study sessions with webcam and screenshare
8. **AI Tutor** - Get instant help with course-specific questions
9. **Progress Tracking** - Monitor daily study time, streaks, and course completion
10. **Themes** - Customize with beautiful themes like Midnight Cosmos, Coral Sunset, Lavender Dream, and more
11. **Seasonal Theme** - Auto-changing theme based on the current season

**Study Features:**
- Track daily study time and maintain streaks
- Set study goals and monitor progress
- Organize materials by course and topic
- Create custom study schedules
- Access all notes and flashcards in one place

**Contact & Support Information:**
When students ask about support, help, or contact information, provide these SPECIFIC details:

📧 **Email Support:** support@lucero.app
📧 **Technical Issues:** tech@lucero.app
📧 **General Inquiries:** hello@lucero.app
📧 **Bug Reports:** bugs@lucero.app
💬 **Live Chat:** Available in the app (bottom right corner - that's me!)
🐛 **Report Issues:** Use the "Report Issue" button in Settings
📱 **Response Time:** Usually within 24 hours on weekdays

**For specific issues:**
- Account problems → support@lucero.app
- Feature requests → hello@lucero.app
- Technical bugs → bugs@lucero.app or tech@lucero.app
- Billing questions → support@lucero.app
- Partnership inquiries → hello@lucero.app

**How to help students:**
- Answer questions about how to use LUCERO features with SPECIFIC step-by-step instructions
- Provide study tips and learning strategies tailored to their needs
- Help with academic topics and concepts
- Motivate and encourage consistent studying
- Suggest which LUCERO features to use for different study needs
- Provide actual contact information and direct solutions
- Be smart and proactive - anticipate what they need

**Important Guidelines:**
- ALWAYS provide specific, actionable information
- If they ask for contact info, give them the actual emails
- If they ask how to do something, give step-by-step instructions
- Don't say "check the website" or "look in settings" - tell them EXACTLY where and how
- Be direct and helpful, not vague
- Think about what they REALLY need and provide that

Always be helpful, positive, and make learning fun! 🌟`

// Helper function to format AI responses
const formatResponse = (text: string): string => {
    return text
        // Remove ** markdown bold
        .replace(/\*\*(.+?)\*\*/g, '$1')
        // Remove * markdown italic
        .replace(/\*(.+?)\*/g, '$1')
        // Remove extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

export default function ChatbotModal({ onClose }: ChatbotModalProps) {
    const { t } = useTranslation()
    const { limits, incrementUsage } = useSubscription()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: `assistant-welcome-${Date.now()}`,
            role: 'assistant',
            content: t('chat.welcomeMessage'),
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isMaximized, setIsMaximized] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        // Subscription limits temporarily disabled - all users have full access
        // if (!limits.canSendAIMessage) {
        //     const errorMessage: Message = {
        //         id: `assistant-limit-${Date.now()}`,
        //         role: 'assistant',
        //         content: `💬 Chat Limit Reached!\n\nFree plan: 30 AI messages/month\nYou've used all your messages this month.\n\nUpgrade to Pro for unlimited AI chat!`,
        //         timestamp: new Date()
        //     }
        //     setMessages(prev => [...prev, errorMessage])
        //     return
        // }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY
            if (!apiKey) {
                console.error('❌ Gemini API key not found in environment variables')
                throw new Error('Gemini API key not found')
            }

            console.log('🔑 API Key found, making request...')

            // Build conversation history for context
            const conversationHistory = [
                // System prompt first
                {
                    role: 'user',
                    parts: [{ text: LUCERO_SYSTEM_PROMPT }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'I understand! I\'m LUCERO AI, ready to help with studies and answer questions about LUCERO features!' }]
                },
                // Then add all previous messages
                ...messages.slice(1).map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                })),
                // Finally the current user message
                {
                    role: 'user',
                    parts: [{ text: input }]
                }
            ]

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: conversationHistory,
                        generationConfig: {
                            temperature: 0.8,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 2048
                        }
                    })
                }
            )

            console.log('📡 Response status:', response.status)

            if (!response.ok) {
                const errorData = await response.json()
                console.error('❌ API Error Response:', errorData)

                // Check for quota exceeded error
                if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('billing')) {
                    throw new Error('QUOTA_EXCEEDED')
                }

                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`)
            }

            const data = await response.json()
            console.log('✅ API Response received:', data)
            const rawResponse = data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I couldn\'t generate a response.'

            // Format the response to remove markdown and organize it
            const formattedResponse = formatResponse(rawResponse)

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: formattedResponse,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])

            // Subscription usage tracking temporarily disabled
            // await incrementUsage('ai_message')
        } catch (error: any) {
            console.error('❌ Error getting AI response:', error)

            let errorContent = 'Sorry, I encountered an error. Please try again.'

            // Provide specific error message for quota issues
            if (error.message === 'QUOTA_EXCEEDED') {
                errorContent = '⚠️ The Gemini API quota has been exceeded. Please update your API key in the .env file with a new key from https://aistudio.google.com/app/apikey'
            }

            const errorMessage: Message = {
                id: `assistant-error-${Date.now()}`,
                role: 'assistant',
                content: errorContent,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Don't render if minimized
    if (isMinimized) {
        return (
            <div className="chatbot-minimized" onClick={() => setIsMinimized(false)}>
                <div className="chatbot-icon">🤖</div>
                <span>{t('chat.luceroAI')}</span>
            </div>
        )
    }

    return (
        <div className="chatbot-modal-overlay" onClick={onClose}>
            <div className={`chatbot-modal ${isMaximized ? 'maximized' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="chatbot-header">
                    <div className="chatbot-header-content">
                        <div className="chatbot-icon">🤖</div>
                        <div>
                            <h3>{t('chat.luceroAI')}</h3>
                            <p>{t('chat.studyAssistant')}</p>
                        </div>
                    </div>
                    <div className="chatbot-header-actions">
                        <button
                            className="chatbot-action-btn"
                            onClick={() => setIsMinimized(true)}
                            title={t('chat.minimize')}
                        >
                            −
                        </button>
                        <button
                            className="chatbot-action-btn"
                            onClick={() => setIsMaximized(!isMaximized)}
                            title={isMaximized ? t('chat.restore') : t('chat.maximize')}
                        >
                            {isMaximized ? '❐' : '□'}
                        </button>
                        <button className="chatbot-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="chatbot-messages">
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.role}`}>
                            <div className="message-avatar">
                                {message.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="message-content">
                                <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                                    {message.content}
                                </div>
                                <div className="message-time">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="message assistant">
                            <div className="message-avatar">🤖</div>
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chatbot-input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        className="chatbot-input"
                        placeholder={t('chat.inputPlaceholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />
                    <button
                        className="chatbot-send-btn"
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                    >
                        {loading ? '⏳' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    )
}
