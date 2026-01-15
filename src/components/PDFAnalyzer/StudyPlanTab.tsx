import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        'http://localhost:3002/api/claude',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            maxTokens: 3000
          })
        }
      )

      const data = await response.json()
      const aiResponse = data.text

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: GenerateStudyPlanResponse = JSON.parse(jsonMatch[0])
        const plan = await createStudyPlan(analysisId, userId, duration, parsed)
        setStudyPlan(plan)
      }
    } catch (err) {
      console.error('Generate study plan error:', err)
      alert(t('pdfAnalyzer.studyPlan.errorGenerate'))
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>{t('pdfAnalyzer.studyPlan.loading')}</p></div>
  }

  if (!studyPlan) {
    return (
      <div className="studyplan-generate">
        <div className="generate-icon">📅</div>
        <h3>{t('pdfAnalyzer.studyPlan.generateTitle')}</h3>
        <p>{t('pdfAnalyzer.studyPlan.generateDescription')}</p>

        <div className="duration-selector">
          <label>{t('pdfAnalyzer.studyPlan.studyDuration')}</label>
          <select value={duration} onChange={(e) => setDuration(+e.target.value)}>
            <option value={3}>{t('pdfAnalyzer.studyPlan.duration3Days')}</option>
            <option value={7}>{t('pdfAnalyzer.studyPlan.duration1Week')}</option>
            <option value={14}>{t('pdfAnalyzer.studyPlan.duration2Weeks')}</option>
            <option value={30}>{t('pdfAnalyzer.studyPlan.duration1Month')}</option>
          </select>
        </div>

        <button
          className="btn-generate"
          onClick={generatePlan}
          disabled={generating}
        >
          {generating ? t('pdfAnalyzer.studyPlan.generating') : t('pdfAnalyzer.studyPlan.generateButton')}
        </button>
      </div>
    )
  }

  return (
    <div className="studyplan-tab">
      <div className="studyplan-header">
        <h3>{t('pdfAnalyzer.studyPlan.title', { title })}</h3>
        <span className="plan-duration">{t('pdfAnalyzer.studyPlan.daysCount', { count: studyPlan.duration_days })}</span>
      </div>

      <div className="daily-schedule">
        {studyPlan.plan_data.days.map((day, idx) => (
          <div key={idx} className="day-card">
            <div className="day-header">
              <h4>{t('pdfAnalyzer.studyPlan.dayNumber', { day: day.day })}</h4>
              <span className="day-date">
                {format(addDays(new Date(), idx), 'MMM dd, yyyy')}
              </span>
            </div>

            <div className="day-content">
              <div className="day-section">
                <strong>{t('pdfAnalyzer.studyPlan.topics')}</strong>
                <ul className="topics-list">
                  {day.topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>

              <div className="day-section">
                <strong>{t('pdfAnalyzer.studyPlan.activities')}</strong>
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
          <h4>{t('pdfAnalyzer.studyPlan.milestones')}</h4>
          <ul>
            {studyPlan.plan_data.milestones.map((milestone, i) => (
              <li key={i}>{milestone}</li>
            ))}
          </ul>
        </div>

        <div className="tips-section">
          <h4>{t('pdfAnalyzer.studyPlan.studyTips')}</h4>
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
