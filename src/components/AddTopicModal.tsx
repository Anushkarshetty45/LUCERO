import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createLesson } from '../services/api'
import { Lesson } from '../types'
import './AddTopicModal.css'

// Modal for adding new topics to a course

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
  const { t } = useTranslation()
  const [topicName, setTopicName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatingNotes, setGeneratingNotes] = useState(false)

  const generateNotes = async (topic: string): Promise<string> => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error(t('addTopic.errorNoApiKey'))
    }

    const prompt = `Create comprehensive, well-structured study notes about "${topic}" for a "${courseSubject}" course titled "${courseTitle}". Write as a knowledgeable tutor explaining to a student.

# ${topic}

## Overview
- Clear definition of ${topic}
- Why it matters in ${courseSubject} and how it fits into ${courseTitle}
- Key prerequisites or background knowledge needed

## Core Concepts & Theory
Explain each fundamental concept thoroughly using **bold** for key terms. Use analogies to make complex ideas clear. Cover the underlying principles and theory in enough depth that a student can genuinely understand — not just memorize.

## How It Works
Detailed step-by-step breakdown of the mechanism, process, or logic. Explain the "why" behind each step, not just the "what". Include any important formulas, rules, or frameworks.

## Real-World Applications
4-5 concrete examples showing ${topic} in action across different contexts:
- Each example should explain the scenario and why ${topic} applies
- Include both common everyday examples and professional/academic uses

## Types & Variations (if applicable)
Break down any important categories, types, or variations. Compare their differences, when to use each, and their trade-offs.

## Common Mistakes & How to Avoid Them
5 frequent misconceptions or errors students make with this topic, and how to avoid or fix each one.

## Key Takeaways
8-10 bullet points covering the most important things to remember about ${topic}.

## Practice Questions
- **Easy:** 2 questions testing basic recall
- **Medium:** 2 questions requiring understanding and application
- **Hard:** 1 question requiring analysis or synthesis
Include a brief hint for each.

FORMAT: Use ## for sections, ### for subsections, **bold** for key terms, bullet points and numbered lists throughout. Be thorough but clear.`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
              maxOutputTokens: 8192,
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

      return htmlContent
    } catch (error: any) {
      console.error('AI Generation Error:', error)
      throw new Error(t('addTopic.errorGenerate') + ': ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topicName.trim()) {
      setError(t('addTopic.errorTopicName'))
      return
    }

    setLoading(true)
    setGeneratingNotes(true)
    setError('')

    try {
      // Generate notes using AI
      console.log('🤖 Generating notes for:', topicName)
      const notes = await generateNotes(topicName)

      console.log('✅ Notes generated successfully')

      // Create lesson with generated notes
      const newLesson = await createLesson({
        course_id: courseId,
        title: topicName,
        content: notes
      })

      console.log('📝 Lesson created:', newLesson)

      onSuccess(newLesson)
    } catch (err: any) {
      console.error('❌ Error:', err)
      setError(err.message || t('addTopic.errorFailed'))
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('addTopic.title')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="course-info">
              {t('addTopic.course')} <strong>{courseTitle}</strong> ({courseSubject})
            </p>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="topicName">{t('addTopic.topicName')}</label>
              <input
                id="topicName"
                type="text"
                placeholder={t('addTopic.topicPlaceholder')}
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                disabled={loading}
                required
              />
              <span className="hint">{t('addTopic.hint')}</span>
            </div>

            {generatingNotes && (
              <div className="generating-status">
                <div className="spinner-small"></div>
                <p>{t('addTopic.generatingStatus')}</p>
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? t('addTopic.generating') : t('addTopic.generateButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

