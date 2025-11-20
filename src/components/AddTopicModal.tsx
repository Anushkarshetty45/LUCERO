import { useState } from 'react'
import { createLesson } from '../services/api'
import { Lesson } from '../types'
import './AddTopicModal.css'

interface AddTopicModalProps {
  courseId: string
  courseTitle: string
  courseSubject: string
  onClose: () => void
  onSuccess: (lesson: Lesson) => void
}

export default function AddTopicModal({ 
  courseId, 
  courseTitle, 
  courseSubject, 
  onClose, 
  onSuccess 
}: AddTopicModalProps) {
  const [topicName, setTopicName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatingNotes, setGeneratingNotes] = useState(false)

  const generateNotes = async (topic: string): Promise<string> => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add REACT_APP_GEMINI_API_KEY to your .env file')
    }

    const prompt = `You are an expert educator creating comprehensive study notes. Generate detailed, in-depth notes about "${topic}" for a "${courseSubject}" course titled "${courseTitle}".

Please provide:

1. **Introduction**: A thorough introduction explaining what ${topic} is and why it's important in ${courseSubject}

2. **Fundamental Concepts**: Break down the core concepts in detail with clear explanations

3. **Detailed Explanation**: Provide a deep, comprehensive explanation with:
   - Historical background or context
   - Step-by-step breakdown of how it works
   - Scientific/theoretical foundations
   - Real-world applications and examples
   - Common misconceptions and clarifications

4. **Key Principles and Laws**: List and explain any important principles, laws, or rules related to this topic

5. **Examples and Case Studies**: Provide at least 3-4 detailed, practical examples with explanations

6. **Diagrams and Visualizations**: Describe what diagrams or visual aids would help understand this topic

7. **Practice Problems**: Suggest 2-3 practice questions or problems to test understanding

8. **Common Mistakes**: List common errors or misunderstandings students have about this topic

9. **Advanced Concepts**: Introduce related advanced topics for further study

10. **Summary**: A comprehensive summary of key takeaways

Format the response in clean HTML with proper headings (h3, h4), paragraphs, lists, and emphasis where appropriate. Make it detailed, educational, and easy to understand. Aim for at least 800-1000 words of content.`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to generate notes')
      }

      const data = await response.json()
      const generatedText = data.candidates[0].content.parts[0].text

      // Convert markdown-style formatting to HTML
      let htmlContent = generatedText
        // Convert **bold** to <strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert *italic* to <em>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert ### Heading to <h3>
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        // Convert ## Heading to <h2>
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        // Convert # Heading to <h1>
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Convert numbered lists
        .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>')
        // Convert bullet points
        .replace(/^[-*]\s+(.*$)/gim, '<li>$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
        // Convert double line breaks to paragraphs
        .replace(/\n\n/g, '</p><p>')
        // Wrap in paragraph tags
        .replace(/^(?!<[hul])/gim, '<p>')
        .replace(/(?<![>])$/gim, '</p>')

      return `<h2>${topic}</h2>${htmlContent}`
    } catch (error: any) {
      console.error('AI Generation Error:', error)
      throw new Error('Failed to generate notes with AI: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topicName.trim()) {
      setError('Please enter a topic name')
      return
    }

    setLoading(true)
    setGeneratingNotes(true)
    setError('')

    try {
      // Generate notes using AI
      console.log('🤖 Generating notes for:', topicName)
      const generatedNotes = await generateNotes(topicName)
      
      console.log('✅ Notes generated successfully')
      
      // Create lesson with generated notes
      const newLesson = await createLesson({
        course_id: courseId,
        title: topicName,
        content: generatedNotes,
        order_index: 0,
        duration: 15
      })

      console.log('📝 Lesson created:', newLesson)
      onSuccess(newLesson)
    } catch (err: any) {
      console.error('❌ Error:', err)
      setError(err.message || 'Failed to create topic')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Topic</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="course-info">
              Course: <strong>{courseTitle}</strong> ({courseSubject})
            </p>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="topicName">Topic Name</label>
              <input
                id="topicName"
                type="text"
                placeholder="e.g., Introduction to Atomic Structure"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                disabled={loading}
                required
              />
              <span className="hint">What topic would you like to learn about?</span>
            </div>

            {generatingNotes && (
              <div className="generating-status">
                <div className="spinner-small"></div>
                <p>🤖 Generating detailed notes with AI...</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Generating...' : '✨ Generate Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

