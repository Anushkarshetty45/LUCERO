import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      // Settings would be saved to a user_settings table
      // For now, just show success
      await new Promise(resolve => setTimeout(resolve, 1000))
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
    </div>
  )
}
