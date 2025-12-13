import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { getProfile, getTodayStudyTime, calculateUserStreak } from '../services/api'
import { supabase } from '../services/supabase'
import { Profile as ProfileType } from '../types'
import './Profile.css'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [totalCourses, setTotalCourses] = useState(0)
  const [todayStudyTime, setTodayStudyTime] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalStudyTime, setTotalStudyTime] = useState(0)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await getProfile(user!.id)
      setProfile(profileData)
      setFirstName(profileData.first_name || '')
      setLastName(profileData.last_name || '')
      setBio(profileData.bio || '')
      setLocation(profileData.location || '')

      // Load statistics
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('user_id', user!.id)
      setTotalCourses(courses?.length || 0)

      const studyTime = await getTodayStudyTime(user!.id)
      setTodayStudyTime(studyTime)

      const streakDays = await calculateUserStreak(user!.id)
      setStreak(streakDays)

      // Calculate total study time
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('duration')
        .eq('user_id', user!.id)
      const total = sessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0
      setTotalStudyTime(total)

    } catch (error) {
      console.error('Error loading profile:', error)
      setFirstName(user?.user_metadata?.first_name || '')
      setLastName(user?.user_metadata?.last_name || '')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user!.id)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            bio: bio,
            location: location,
            updated_at: new Date().toISOString()
          })
          .eq('id', user!.id)

        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user!.id,
            email: user!.email!,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            bio: bio,
            location: location,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      }

      await loadProfile()
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/auth')
    } catch (error) {
      console.error('Sign out error:', error)
      navigate('/auth')
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <h2>{profile?.full_name || 'User'}</h2>
            <p className="profile-email">{profile?.email || user?.email}</p>
          </div>

          {/* Statistics Section */}
          <div className="profile-stats-section">
            <h3>Study Statistics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-value">{totalCourses}</div>
                <div className="stat-label">Total Courses</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{streak}</div>
                <div className="stat-label">Day Streak</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{Math.floor(todayStudyTime / 60)}h {todayStudyTime % 60}m</div>
                <div className="stat-label">Today's Study</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{Math.floor(totalStudyTime / 60)}h</div>
                <div className="stat-label">Total Study Time</div>
              </div>
            </div>
          </div>

          <div className="profile-info-section">
            <h3>Personal Information</h3>

            {editing ? (
              <div className="profile-form">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      fontSize: '15px',
                      color: '#fff',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile?.email || user?.email || ''}
                    disabled
                  />
                  <small>Email cannot be changed</small>
                </div>
                <div className="profile-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditing(false)
                      setFirstName(profile?.first_name || '')
                      setLastName(profile?.last_name || '')
                      setBio(profile?.bio || '')
                      setLocation(profile?.location || '')
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">First Name</span>
                  <span className="info-value">{profile?.first_name || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Name</span>
                  <span className="info-value">{profile?.last_name || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Bio</span>
                  <span className="info-value">{profile?.bio || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Location</span>
                  <span className="info-value">{profile?.location || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{profile?.email || user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Member Since</span>
                  <span className="info-value">
                    {new Date(profile?.created_at || '').toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <button className="btn-edit" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          <div className="profile-danger-zone">
            <h3>Account Actions</h3>
            <button className="btn-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
