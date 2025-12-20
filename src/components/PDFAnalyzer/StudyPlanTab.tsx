import { useState, useEffect } from 'react'
import { getStudyPlan, createStudyPlan } from '../../services/pdfAnalysisApi'
import { generateStudyPlanPrompt } from '../../services/aiPrompts'
import { addDays, format } from 'date-fns'
import type { PDFStudyPlan, GenerateStudyPlanResponse } from '../../types/pdfAnalysis'

interface StudyPlanTabProps {
  analysisId: string
  pdfContent: string
  title: string
  userId: string
}

export default function StudyPlanTab({ analysisId, pdfContent, title, userId }: StudyPlanTabProps) {
  const [studyPlan, setStudyPlan] = useState<PDFStudyPlan | null>(null)
  const [duration, setDuration] = useState(7)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudyPlan()
  }, [analysisId])

  const loadStudyPlan = async () => {
    try {
      setLoading(true)
      const plan = await getStudyPlan(analysisId)
      setStudyPlan(plan)
    } catch (err) {
      console.error('Load study plan error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePlan = async () => {
    setGenerating(true)
    try {
      const prompt = generateStudyPlanPrompt(pdfContent.substring(0, 10000), duration)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3000
            }
          })
        }
      )

      const data = await response.json()
      const aiResponse = data.candidates[0].content.parts[0].text

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: GenerateStudyPlanResponse = JSON.parse(jsonMatch[0])
        const plan = await createStudyPlan(analysisId, userId, duration, parsed)
        setStudyPlan(plan)
      }
    } catch (err) {
      console.error('Generate study plan error:', err)
      alert('Failed to generate study plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>Loading study plan...</p></div>
  }

  if (!studyPlan) {
    return (
      <div className="studyplan-generate">
        <div className="generate-icon">📅</div>
        <h3>Generate Study Plan</h3>
        <p>Create a personalized study schedule to master this material.</p>

        <div className="duration-selector">
          <label>Study Duration:</label>
          <select value={duration} onChange={(e) => setDuration(+e.target.value)}>
            <option value={3}>3 days (Intensive)</option>
            <option value={7}>1 week</option>
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
          </select>
        </div>

        <button
          className="btn-generate"
          onClick={generatePlan}
          disabled={generating}
        >
          {generating ? '⏳ Generating...' : '✨ Generate Study Plan'}
        </button>
      </div>
    )
  }

  return (
    <div className="studyplan-tab">
      <div className="studyplan-header">
        <h3>📅 Study Plan: {title}</h3>
        <span className="plan-duration">{studyPlan.duration_days} days</span>
      </div>

      <div className="daily-schedule">
        {studyPlan.plan_data.days.map((day, idx) => (
          <div key={idx} className="day-card">
            <div className="day-header">
              <h4>Day {day.day}</h4>
              <span className="day-date">
                {format(addDays(new Date(), idx), 'MMM dd, yyyy')}
              </span>
            </div>

            <div className="day-content">
              <div className="day-section">
                <strong>📚 Topics:</strong>
                <ul className="topics-list">
                  {day.topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>

              <div className="day-section">
                <strong>✅ Activities:</strong>
                <ul className="activities-list">
                  {day.activities.map((activity, i) => (
                    <li key={i}>
                      <input type="checkbox" id={`activity-${idx}-${i}`} />
                      <label htmlFor={`activity-${idx}-${i}`}>{activity}</label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="day-time">
                ⏱️ {day.estimated_time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="plan-extras">
        <div className="milestones-section">
          <h4>🎯 Milestones</h4>
          <ul>
            {studyPlan.plan_data.milestones.map((milestone, i) => (
              <li key={i}>{milestone}</li>
            ))}
          </ul>
        </div>

        <div className="tips-section">
          <h4>💡 Study Tips</h4>
          <ul>
            {studyPlan.plan_data.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
