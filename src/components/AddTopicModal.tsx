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
    // For now, return a template
    // TODO: Replace with actual AI API call (OpenAI/Gemini)
    
    return `
      <h2>${topic}</h2>
      
      <h3>Overview</h3>
      <p>This is a comprehensive guide to understanding ${topic} in the context of ${courseSubject}.</p>
      
      <h3>Key Concepts</h3>
      <ul>
        <li><strong>Concept 1:</strong> Introduction to the fundamental principles</li>
        <li><strong>Concept 2:</strong> Understanding the core components</li>
        <li><strong>Concept 3:</strong> Practical applications and examples</li>
      </ul>
      
      <h3>Detailed Explanation</h3>
      <p>${topic} is an important topic in ${courseSubject}. It covers various aspects that are essential for understanding the subject matter.</p>
      
      <h3>Examples</h3>
      <p>Example 1: A practical demonstration of ${topic}</p>
      <p>Example 2: Real-world application scenarios</p>
      
      <h3>Key Takeaways</h3>
      <ul>
        <li>Understanding the basics of ${topic}</li>
        <li>Applying concepts in practical scenarios</li>
        <li>Building upon foundational knowledge</li>
      </ul>
      
      <p><em>Note: These are template notes. To enable AI-powered note generation, you need to integrate an AI API (OpenAI, Gemini, etc.)</em></p>
    `
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

