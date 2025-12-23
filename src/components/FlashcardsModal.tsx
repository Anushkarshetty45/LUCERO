import { useState, useEffect } from 'react'
import { getCourses, getLessons } from '../services/api'
import type { Course, Lesson } from '../types'
import './FlashcardsModal.css'

interface FlashcardsModalProps {
  onClose: () => void
  userId: string
}

interface Flashcard {
  id: number
  question: string
  answer: string
  category: string
}

type ViewMode = 'select-course' | 'select-topics' | 'generating' | 'study'

export default function FlashcardsModal({ onClose, userId }: FlashcardsModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('select-course')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [topics, setTopics] = useState<Lesson[]>([])
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCourses()
  }, [userId])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await getCourses(userId)
      setCourses(data)
    } catch (err) {
      console.error('Error loading courses:', err)
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course)
    setLoading(true)
    setError('')

    try {
      const lessonsData = await getLessons(course.id)
      setTopics(lessonsData)
      setViewMode('select-topics')
    } catch (err) {
      console.error('Error loading topics:', err)
      setError('Failed to load topics for this course')
    } finally {
      setLoading(false)
    }
  }

  const toggleTopicSelection = (topicId: string) => {
    const newSelection = new Set(selectedTopics)
    if (newSelection.has(topicId)) {
      newSelection.delete(topicId)
    } else {
      newSelection.add(topicId)
    }
    setSelectedTopics(newSelection)
  }

  const generateFlashcards = async () => {
    if (selectedTopics.size === 0) {
      setError('Please select at least one topic')
      return
    }

    setViewMode('generating')
    setError('')

    try {
      // Get selected topics' content
      const selectedTopicsData = topics.filter(t => selectedTopics.has(t.id))
      const topicsContent = selectedTopicsData.map(t => ({
        title: t.title,
        content: t.content || ''
      }))

      const prompt = `Based on the following course topics, generate 10 flashcards for studying. Each flashcard should have a question and answer.

Course: ${selectedCourse?.title}
Topics:
${topicsContent.map(t => `\n### ${t.title}\n${t.content}`).join('\n')}

Generate exactly 10 flashcards in the following JSON format:
{
  "flashcards": [
    {
      "question": "Question text here",
      "answer": "Answer text here",
      "category": "Topic name"
    }
  ]
}

Make the flashcards educational, clear, and focused on key concepts from the content.`

      const response = await fetch('http://localhost:3002/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          maxTokens: 3000
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards')
      }

      const aiResponse = data.text

      // Parse JSON response - handle markdown code blocks and plain JSON
      let jsonStr = aiResponse
      
      // Try to extract JSON from markdown code blocks
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim()
      } else {
        // Try to find JSON object in the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        }
      }

      try {
        const parsed = JSON.parse(jsonStr)
        const flashcardsArray = parsed.flashcards || parsed
        
        if (!Array.isArray(flashcardsArray)) {
          throw new Error('Invalid flashcards format')
        }

        const generatedCards = flashcardsArray.map((card: any, idx: number) => ({
          id: idx + 1,
          question: card.question || '',
          answer: card.answer || '',
          category: card.category || 'General'
        }))

        setFlashcards(generatedCards)
        setViewMode('study')
      } catch (parseError) {
        console.error('Parse error:', parseError)
        console.error('AI Response:', aiResponse)
        throw new Error('Failed to parse flashcards from AI response')
      }
    } catch (err: any) {
      console.error('Error generating flashcards:', err)
      setError(err.message || 'Failed to generate flashcards. Please try again.')
      setViewMode('select-topics')
    }
  }

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const handlePrevious = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  const handleReset = () => {
    setViewMode('select-course')
    setSelectedCourse(null)
    setSelectedTopics(new Set())
    setFlashcards([])
    setCurrentIndex(0)
    setIsFlipped(false)
    setError('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="flashcards-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🃏 Flashcards</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Course Selection View */}
          {viewMode === 'select-course' && (
            <div className="selection-view">
              <h3>Select a Course</h3>
              <p>Choose the course you want to generate flashcards for:</p>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="empty-state">
                  <p>📚 No courses found. Create a course first!</p>
                </div>
              ) : (
                <div className="courses-list">
                  {courses.map(course => (
                    <button
                      key={course.id}
                      className="course-option"
                      onClick={() => handleCourseSelect(course)}
                      style={{ borderLeft: `4px solid ${course.color}` }}
                    >
                      <div className="course-info">
                        <h4>{course.title}</h4>
                        <p>{course.subject}</p>
                      </div>
                      <span className="arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Topic Selection View */}
          {viewMode === 'select-topics' && (
            <div className="selection-view">
              <div className="breadcrumb">
                <button onClick={() => setViewMode('select-course')}>← Back to Courses</button>
              </div>

              <h3>{selectedCourse?.title}</h3>
              <p>Select the topics you want to study (you can select multiple):</p>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading topics...</p>
                </div>
              ) : topics.length === 0 ? (
                <div className="empty-state">
                  <p>📝 No topics found in this course. Add some topics first!</p>
                </div>
              ) : (
                <>
                  <div className="topics-list">
                    {topics.map(topic => (
                      <label
                        key={topic.id}
                        className={`topic-option ${selectedTopics.has(topic.id) ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTopics.has(topic.id)}
                          onChange={() => toggleTopicSelection(topic.id)}
                        />
                        <div className="topic-info">
                          <h4>{topic.title}</h4>
                          {topic.content && (
                            <p className="topic-preview">
                              {topic.content.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="action-bar">
                    <div className="selection-count">
                      {selectedTopics.size} topic{selectedTopics.size !== 1 ? 's' : ''} selected
                    </div>
                    <button
                      className="btn-generate-cards"
                      onClick={generateFlashcards}
                      disabled={selectedTopics.size === 0}
                    >
                      ✨ Generate Flashcards
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}

          {/* Generating View */}
          {viewMode === 'generating' && (
            <div className="generating-view">
              <div className="spinner-large"></div>
              <h3>Generating Flashcards...</h3>
              <p>Creating personalized flashcards from your selected topics</p>
            </div>
          )}

          {/* Study View */}
          {viewMode === 'study' && flashcards.length > 0 && (
            <div className="study-view">
              <div className="study-header">
                <button className="btn-back" onClick={handleReset}>
                  ← New Set
                </button>
                <div className="flashcard-count">
                  {currentIndex + 1} / {flashcards.length}
                </div>
              </div>

              <div className="flashcard-container">
                <div
                  className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-front">
                      <div className="flashcard-category">
                        {flashcards[currentIndex].category}
                      </div>
                      <div className="flashcard-content">
                        <p>{flashcards[currentIndex].question}</p>
                      </div>
                      <div className="flashcard-hint">Click to see answer</div>
                    </div>
                    <div className="flashcard-back">
                      <div className="flashcard-category">
                        {flashcards[currentIndex].category}
                      </div>
                      <div className="flashcard-content">
                        <p>{flashcards[currentIndex].answer}</p>
                      </div>
                      <div className="flashcard-hint">Click to see question</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flashcard-controls">
                <button
                  className="btn-nav"
                  onClick={handlePrevious}
                  disabled={flashcards.length <= 1}
                >
                  ← Previous
                </button>
                <button
                  className="btn-shuffle"
                  onClick={() => {
                    setCurrentIndex(Math.floor(Math.random() * flashcards.length))
                    setIsFlipped(false)
                  }}
                >
                  🔀 Shuffle
                </button>
                <button
                  className="btn-nav"
                  onClick={handleNext}
                  disabled={flashcards.length <= 1}
                >
                  Next →
                </button>
              </div>

              <div className="progress-dots">
                {flashcards.map((_, idx) => (
                  <div
                    key={idx}
                    className={`dot ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentIndex(idx)
                      setIsFlipped(false)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
