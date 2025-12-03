import { useState, useRef, useEffect } from 'react'
import './ChatbotModal.css'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface ChatbotModalProps {
    onClose: () => void
}

export default function ChatbotModal({ onClose }: ChatbotModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hi! I\'m LUCERO AI, your study assistant. Ask me anything about your courses, study tips, or any topic you\'re learning!',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
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

        const userMessage: Message = {
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

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are LUCERO AI, a helpful study assistant. Answer the following question concisely and helpfully: ${input}`
                            }]
                        }]
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
            const aiResponse = data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I couldn\'t generate a response.'

            const assistantMessage: Message = {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error: any) {
            console.error('❌ Error getting AI response:', error)

            let errorContent = 'Sorry, I encountered an error. Please try again.'

            // Provide specific error message for quota issues
            if (error.message === 'QUOTA_EXCEEDED') {
                errorContent = '⚠️ The Gemini API quota has been exceeded. Please update your API key in the .env file with a new key from https://aistudio.google.com/app/apikey'
            }

            const errorMessage: Message = {
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

    return (
        <div className="chatbot-modal-overlay" onClick={onClose}>
            <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
                <div className="chatbot-header">
                    <div className="chatbot-header-content">
                        <div className="chatbot-icon">🤖</div>
                        <div>
                            <h3>LUCERO AI</h3>
                            <p>Your Study Assistant</p>
                        </div>
                    </div>
                    <button className="chatbot-close" onClick={onClose}>✕</button>
                </div>

                <div className="chatbot-messages">
                    {messages.map((message, index) => (
                        <div key={index} className={`message ${message.role}`}>
                            <div className="message-avatar">
                                {message.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="message-content">
                                <div className="message-text">{message.content}</div>
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
                        placeholder="Ask me anything..."
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
