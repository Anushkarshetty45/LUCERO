import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../services/supabase'
import ThemeModal from '../components/ThemeModal'
import { themeMetadata } from '../styles/themeDefinitions'
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
  created_at?: string
  updated_at?: string
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { currentTheme, particlesEnabled, setParticlesEnabled } = useTheme()
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
        setLanguage(data.language)
        setTimezone(data.timezone)
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
      const [courses, notes, sessions] = await Promise.all([
        supabase.from('courses').select('*').eq('user_id', user!.id),
        supabase.from('user_notes').select('*').eq('user_id', user!.id),
        supabase.from('study_sessions').select('*').eq('user_id', user!.id)
      ])

      const exportData = {
        courses: courses.data,
        notes: notes.data,
        study_sessions: sessions.data,
        exported_at: new Date().toISOString()
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lucero-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert('Data exported successfully!')
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
          ← Back to Dashboard
        </button>
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="settings-section">
            <h2>Preferences</h2>
            <div className="setting-item">
              <div className="setting-info">
                <h3>Notifications</h3>
                <p>Receive notifications about your study progress</p>
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
                <h3>Email Updates</h3>
                <p>Get weekly study summaries and updates via email</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailUpdates}
                  onChange={(e) => setEmailUpdates(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Dark Mode</h3>
                <p>Use dark theme across the application</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <button
              className="btn-save"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          <div className="settings-section">
            <h2>Appearance</h2>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Theme</h3>
                <p>Customize your app's color scheme</p>
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
                <h3>Animated Background</h3>
                <p>Show floating particles and visual effects</p>
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
            <h2>Account Security</h2>
            <div className="account-info">
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email}</span>
              </div>
            </div>

            {!changePassword ? (
              <button
                className="btn-change-password"
                onClick={() => setChangePassword(true)}
              >
                Change Password
              </button>
            ) : (
              <div className="password-form">
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
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
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handlePasswordChange}
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="settings-section danger-zone">
            <h2>Danger Zone</h2>
            <p className="danger-warning">
              These actions are irreversible. Please be careful.
            </p>
            <button className="btn-delete-account">
              Delete Account
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
