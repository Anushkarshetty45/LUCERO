import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../services/supabase'
import ThemeModal from '../components/ThemeModal'
import { themeMetadata } from '../styles/themeDefinitions'
import jsPDF from 'jspdf'
import { useTranslation } from 'react-i18next'
import './Settings.css'

interface UserSettings {
  id?: string
  user_id: string
  notifications_enabled: boolean
  email_updates: boolean
  dark_mode: boolean
  study_reminders: boolean
  reminder_time: string
  auto_save_notes: boolean
  sound_effects: boolean
  language: string
  timezone: string
  note_font_size: string
  created_at?: string
  updated_at?: string
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { currentTheme, particlesEnabled, setParticlesEnabled } = useTheme()
  const { t, i18n } = useTranslation()
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [studyReminders, setStudyReminders] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [autoSaveNotes, setAutoSaveNotes] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')
  const [noteFontSize, setNoteFontSize] = useState('medium')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [changePassword, setChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      loadSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error
      }

      if (data) {
        setNotificationsEnabled(data.notifications_enabled)
        setEmailUpdates(data.email_updates)
        setDarkMode(data.dark_mode)
        setStudyReminders(data.study_reminders)
        setReminderTime(data.reminder_time)
        setAutoSaveNotes(data.auto_save_notes)
        setSoundEffects(data.sound_effects)
        const userLang = data.language || 'en'
        setLanguage(userLang)
        // Set i18n language
        i18n.changeLanguage(userLang)
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
        setNoteFontSize(data.note_font_size || 'medium')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)

      const settings: UserSettings = {
        user_id: user!.id,
        notifications_enabled: notificationsEnabled,
        email_updates: emailUpdates,
        dark_mode: darkMode,
        study_reminders: studyReminders,
        reminder_time: reminderTime,
        auto_save_notes: autoSaveNotes,
        sound_effects: soundEffects,
        language: language,
        timezone: timezone,
        note_font_size: noteFontSize,
        updated_at: new Date().toISOString()
      }

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user!.id)
        .single()

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_settings')
          .update(settings)
          .eq('user_id', user!.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase
          .from('user_settings')
          .insert({ ...settings, created_at: new Date().toISOString() })

        if (error) throw error
      }

      // Change language immediately
      i18n.changeLanguage(language)

      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      alert('Password updated successfully!')
      setChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      // Fetch all user data
      const [courses, profileData] = await Promise.all([
        supabase.from('courses').select('*').eq('user_id', user!.id).order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').eq('id', user!.id).single()
      ])

      // Create PDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      let yPosition = 20

      // Helper function to add text with word wrap and paragraph support
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false, indent: number = 0) => {
        doc.setFontSize(fontSize)
        if (isBold) doc.setFont('helvetica', 'bold')
        else doc.setFont('helvetica', 'normal')

        // Split by line breaks to preserve paragraphs
        const paragraphs = text.split('\n').filter(p => p.trim().length > 0)

        paragraphs.forEach((paragraph, idx) => {
          const lines = doc.splitTextToSize(paragraph.trim(), pageWidth - 2 * margin - indent)
          doc.text(lines, margin + indent, yPosition)
          yPosition += lines.length * (fontSize / 2) + 5

          // Add spacing between paragraphs
          if (idx < paragraphs.length - 1) {
            yPosition += 3
          }

          // Add new page if needed
          if (yPosition > doc.internal.pageSize.height - 30) {
            doc.addPage()
            yPosition = 20
          }
        })
      }

      // Helper to add a separator line
      const addSeparator = () => {
        yPosition += 5
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10
      }

      // Title Page
      addText('LUCERO - Data Export Report', 20, true)
      yPosition += 5
      addText(`Generated: ${new Date().toLocaleString()}`, 10)
      addText(`User: ${profileData.data?.full_name || user!.email}`, 10)
      yPosition += 15

      // Courses Section with Topics and Content
      addText('YOUR COURSES & TOPICS', 16, true)
      yPosition += 5
      if (courses.data && courses.data.length > 0) {
        for (let courseIndex = 0; courseIndex < courses.data.length; courseIndex++) {
          const course = courses.data[courseIndex]
          addSeparator()

          // Course Header
          addText(`${courseIndex + 1}. ${course.title}`, 14, true)
          addText(`Subject: ${course.subject}`, 10, false, 10)
          if (course.description) {
            addText(`Description: ${course.description}`, 10, false, 10)
          }
          addText(`Created: ${new Date(course.created_at).toLocaleDateString()}`, 10, false, 10)
          yPosition += 8

          // Fetch lessons/topics for this course
          const { data: lessons } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', course.id)
            .order('created_at', { ascending: true })

          if (lessons && lessons.length > 0) {
            addText('Topics:', 12, true, 10)
            yPosition += 3

            for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
              const lesson = lessons[lessonIndex]
              addText(`${lessonIndex + 1}. ${lesson.title}`, 11, true, 20)
              yPosition += 2

              // Add lesson content if available
              if (lesson.content) {
                // Clean and format the content
                let content = lesson.content
                // Remove HTML tags if any
                content = content.replace(/<[^>]*>/g, '')
                // Add full content to PDF
                addText(content, 9, false, 30)
                yPosition += 5
              }

              // Add AI-generated summary if available
              if (lesson.ai_summary) {
                addText('AI Summary:', 10, true, 30)
                yPosition += 2
                addText(lesson.ai_summary, 9, false, 35)
                yPosition += 5
              }

              // Add flashcards if available
              if (lesson.flashcards && lesson.flashcards.length > 0) {
                addText(`Flashcards: ${lesson.flashcards.length} cards`, 10, true, 30)
                yPosition += 2
                lesson.flashcards.slice(0, 3).forEach((card: any) => {
                  addText(`Q: ${card.question}`, 9, false, 35)
                  addText(`A: ${card.answer}`, 9, false, 35)
                  yPosition += 2
                })
                if (lesson.flashcards.length > 3) {
                  addText(`... and ${lesson.flashcards.length - 3} more flashcards`, 9, false, 35)
                }
                yPosition += 5
              }

              // Add quiz if available
              if (lesson.quiz && lesson.quiz.length > 0) {
                addText(`Quiz: ${lesson.quiz.length} questions`, 10, true, 30)
                yPosition += 2
                for (let qIdx = 0; qIdx < Math.min(2, lesson.quiz.length); qIdx++) {
                  const q = lesson.quiz[qIdx]
                  addText(`Q${qIdx + 1}: ${q.question}`, 9, false, 35)
                  yPosition += 1
                  if (q.options) {
                    q.options.forEach((opt: string, optIdx: number) => {
                      const marker = optIdx === q.correctAnswer ? '✓' : ' '
                      addText(`  ${marker} ${opt}`, 8, false, 40)
                    })
                  }
                  yPosition += 3
                }
                if (lesson.quiz.length > 2) {
                  addText(`... and ${lesson.quiz.length - 2} more questions`, 9, false, 35)
                }
                yPosition += 5
              }

              yPosition += 8
            }
          } else {
            addText('No topics created yet.', 10, false, 20)
            yPosition += 5
          }

          // Fetch and display notes for this course
          const { data: courseNotes } = await supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', user!.id)
            .eq('course_id', course.id)
            .order('created_at', { ascending: true })

          if (courseNotes && courseNotes.length > 0) {
            addText('Your Notes:', 12, true, 10)
            yPosition += 3
            for (let noteIdx = 0; noteIdx < courseNotes.length; noteIdx++) {
              const note = courseNotes[noteIdx]
              addText(`Note ${noteIdx + 1} (${new Date(note.created_at).toLocaleDateString()}):`, 10, true, 20)
              yPosition += 2
              // Add full note content to PDF
              const noteContent = note.content || 'Empty note'
              addText(noteContent, 9, false, 25)
              yPosition += 5
            }
          }

          yPosition += 10
        }
      } else {
        addText('No courses found.', 10)
      }

      // Save PDF
      doc.save(`lucero-data-export-${new Date().toISOString().split('T')[0]}.pdf`)
      alert('Data exported successfully as PDF!')
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Are you absolutely sure? This action cannot be undone.\n\nType "DELETE" to confirm:'
    )

    if (confirmation !== 'DELETE') {
      alert('Account deletion cancelled')
      return
    }

    try {
      setSaving(true)

      // Delete all user data
      await Promise.all([
        supabase.from('courses').delete().eq('user_id', user!.id),
        supabase.from('user_notes').delete().eq('user_id', user!.id),
        supabase.from('study_sessions').delete().eq('user_id', user!.id),
        supabase.from('profiles').delete().eq('id', user!.id),
        supabase.from('user_settings').delete().eq('user_id', user!.id)
      ])

      alert('Account deleted successfully. You will be signed out.')
      await signOut()
      navigate('/auth')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← {t('settings.backToDashboard')}
        </button>
        <h1>{t('settings.title')}</h1>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="settings-section">
            <h2>{t('settings.preferences')}</h2>
            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.notifications')}</h3>
                <p>{t('settings.notificationsDesc')}</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.studyReminders')}</h3>
                <p>{t('settings.studyRemindersDesc')}</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={studyReminders}
                  onChange={(e) => setStudyReminders(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {studyReminders && (
              <div className="setting-item">
                <div className="setting-info">
                  <h3>{t('settings.reminderTime')}</h3>
                  <p>{t('settings.reminderTimeDesc')}</p>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="time-input"
                />
              </div>
            )}

            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.autoSaveNotes')}</h3>
                <p>{t('settings.autoSaveNotesDesc')}</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoSaveNotes}
                  onChange={(e) => setAutoSaveNotes(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.soundEffects')}</h3>
                <p>{t('settings.soundEffectsDesc')}</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.language')}</h3>
                <p>{t('settings.languageDesc')}</p>
              </div>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value)
                }}
                className="setting-select"
              >
                <option value="en">English</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="pt">Português (Portuguese)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="ko">한국어 (Korean)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="ru">Русский (Russian)</option>
                <option value="it">Italiano (Italian)</option>
                <option value="nl">Nederlands (Dutch)</option>
                <option value="pl">Polski (Polish)</option>
                <option value="tr">Türkçe (Turkish)</option>
                <option value="vi">Tiếng Việt (Vietnamese)</option>
                <option value="th">ไทย (Thai)</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="ms">Bahasa Melayu (Malay)</option>
                <option value="sv">Svenska (Swedish)</option>
                <option value="no">Norsk (Norwegian)</option>
                <option value="da">Dansk (Danish)</option>
                <option value="fi">Suomi (Finnish)</option>
                <option value="cs">Čeština (Czech)</option>
                <option value="el">Ελληνικά (Greek)</option>
                <option value="he">עברית (Hebrew)</option>
                <option value="uk">Українська (Ukrainian)</option>
                <option value="ro">Română (Romanian)</option>
                <option value="hu">Magyar (Hungarian)</option>
                <option value="bg">Български (Bulgarian)</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.timezone')}</h3>
                <p>{t('settings.timezoneDesc')}</p>
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="setting-select"
              >
                <optgroup label="UTC">
                  <option value="UTC">UTC - Coordinated Universal Time</option>
                </optgroup>
                <optgroup label="Americas">
                  <option value="America/New_York">New York (EST/EDT)</option>
                  <option value="America/Chicago">Chicago (CST/CDT)</option>
                  <option value="America/Denver">Denver (MST/MDT)</option>
                  <option value="America/Phoenix">Phoenix (MST)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                  <option value="America/Anchorage">Anchorage (AKST/AKDT)</option>
                  <option value="America/Honolulu">Honolulu (HST)</option>
                  <option value="America/Toronto">Toronto (EST/EDT)</option>
                  <option value="America/Vancouver">Vancouver (PST/PDT)</option>
                  <option value="America/Mexico_City">Mexico City (CST/CDT)</option>
                  <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                  <option value="America/Buenos_Aires">Buenos Aires (ART)</option>
                  <option value="America/Santiago">Santiago (CLT)</option>
                  <option value="America/Lima">Lima (PET)</option>
                  <option value="America/Bogota">Bogotá (COT)</option>
                  <option value="America/Caracas">Caracas (VET)</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET/CEST)</option>
                  <option value="Europe/Berlin">Berlin (CET/CEST)</option>
                  <option value="Europe/Madrid">Madrid (CET/CEST)</option>
                  <option value="Europe/Rome">Rome (CET/CEST)</option>
                  <option value="Europe/Amsterdam">Amsterdam (CET/CEST)</option>
                  <option value="Europe/Brussels">Brussels (CET/CEST)</option>
                  <option value="Europe/Vienna">Vienna (CET/CEST)</option>
                  <option value="Europe/Warsaw">Warsaw (CET/CEST)</option>
                  <option value="Europe/Prague">Prague (CET/CEST)</option>
                  <option value="Europe/Budapest">Budapest (CET/CEST)</option>
                  <option value="Europe/Athens">Athens (EET/EEST)</option>
                  <option value="Europe/Istanbul">Istanbul (TRT)</option>
                  <option value="Europe/Moscow">Moscow (MSK)</option>
                  <option value="Europe/Stockholm">Stockholm (CET/CEST)</option>
                  <option value="Europe/Oslo">Oslo (CET/CEST)</option>
                  <option value="Europe/Copenhagen">Copenhagen (CET/CEST)</option>
                  <option value="Europe/Helsinki">Helsinki (EET/EEST)</option>
                  <option value="Europe/Dublin">Dublin (GMT/IST)</option>
                  <option value="Europe/Lisbon">Lisbon (WET/WEST)</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Kolkata">Kolkata/Mumbai (IST)</option>
                  <option value="Asia/Karachi">Karachi (PKT)</option>
                  <option value="Asia/Dhaka">Dhaka (BST)</option>
                  <option value="Asia/Bangkok">Bangkok (ICT)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                  <option value="Asia/Shanghai">Shanghai/Beijing (CST)</option>
                  <option value="Asia/Taipei">Taipei (CST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Seoul">Seoul (KST)</option>
                  <option value="Asia/Manila">Manila (PHT)</option>
                  <option value="Asia/Jakarta">Jakarta (WIB)</option>
                  <option value="Asia/Ho_Chi_Minh">Ho Chi Minh City (ICT)</option>
                  <option value="Asia/Kuala_Lumpur">Kuala Lumpur (MYT)</option>
                  <option value="Asia/Jerusalem">Jerusalem (IST)</option>
                  <option value="Asia/Riyadh">Riyadh (AST)</option>
                </optgroup>
                <optgroup label="Africa">
                  <option value="Africa/Cairo">Cairo (EET)</option>
                  <option value="Africa/Lagos">Lagos (WAT)</option>
                  <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                  <option value="Africa/Nairobi">Nairobi (EAT)</option>
                  <option value="Africa/Casablanca">Casablanca (WET)</option>
                </optgroup>
                <optgroup label="Australia & Pacific">
                  <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
                  <option value="Australia/Melbourne">Melbourne (AEDT/AEST)</option>
                  <option value="Australia/Brisbane">Brisbane (AEST)</option>
                  <option value="Australia/Perth">Perth (AWST)</option>
                  <option value="Australia/Adelaide">Adelaide (ACDT/ACST)</option>
                  <option value="Pacific/Auckland">Auckland (NZDT/NZST)</option>
                  <option value="Pacific/Fiji">Fiji (FJT)</option>
                  <option value="Pacific/Honolulu">Honolulu (HST)</option>
                </optgroup>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.noteFontSize')}</h3>
                <p>{t('settings.noteFontSizeDesc')}</p>
              </div>
              <select
                value={noteFontSize}
                onChange={(e) => setNoteFontSize(e.target.value)}
                className="setting-select"
              >
                <option value="small">{t('fontSizes.small')}</option>
                <option value="medium">{t('fontSizes.medium')}</option>
                <option value="large">{t('fontSizes.large')}</option>
              </select>
            </div>

            <button
              className="btn-save"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? t('settings.saving') : t('settings.savePreferences')}
            </button>
          </div>

          <div className="settings-section">
            <h2>{t('settings.appearance')}</h2>

            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.theme')}</h3>
                <p>{t('settings.themeDesc')}</p>
              </div>
              <button
                className="btn-theme-picker"
                onClick={() => setShowThemeModal(true)}
              >
                {themeMetadata[currentTheme].emoji} {themeMetadata[currentTheme].name}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.animatedBackground')}</h3>
                <p>{t('settings.animatedBackgroundDesc')}</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={particlesEnabled}
                  onChange={(e) => setParticlesEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h2>{t('settings.accountSecurity')}</h2>
            <div className="account-info">
              <div className="info-item">
                <span className="info-label">{t('settings.email')}</span>
                <span className="info-value">{user?.email}</span>
              </div>
            </div>

            {!changePassword ? (
              <button
                className="btn-change-password"
                onClick={() => setChangePassword(true)}
              >
                {t('settings.changePassword')}
              </button>
            ) : (
              <div className="password-form">
                <div className="form-group">
                  <label>{t('settings.newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label>{t('settings.confirmPassword')}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="password-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setChangePassword(false)
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    disabled={saving}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handlePasswordChange}
                    disabled={saving}
                  >
                    {saving ? t('settings.updating') : t('settings.updatePassword')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="settings-section">
            <h2>{t('settings.dataManagement')}</h2>
            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.exportYourData')}</h3>
                <p>{t('settings.exportDesc')}</p>
              </div>
              <button
                className="btn-export"
                onClick={handleExportData}
              >
                📥 {t('settings.exportData')}
              </button>
            </div>
          </div>

          <div className="settings-section danger-zone">
            <h2>{t('settings.dangerZone')}</h2>
            <p className="danger-warning">
              {t('settings.dangerWarning')}
            </p>
            <button
              className="btn-delete-account"
              onClick={handleDeleteAccount}
              disabled={saving}
            >
              {saving ? t('settings.deleting') : t('settings.deleteAccount')}
            </button>
          </div>
        </div>
      </div>

      {/* Theme Modal */}
      {showThemeModal && (
        <ThemeModal onClose={() => setShowThemeModal(false)} />
      )}
    </div>
  )
}
