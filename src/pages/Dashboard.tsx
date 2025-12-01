// FORCE RECOMPILE - VERSION 3
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { getProfile, getCourses, getTodayStudyTime, getCourseWithProgress, calculateUserStreak } from '../services/api'
import { Profile, CourseWithProgress } from '../types'
import { getGreeting, formatTime, getMotivationalQuote } from '../utils/helpers'
import CreateCourseModal from '../components/CreateCourseModal'
import CourseCard from '../components/CourseCard'
import AllNotesModal from '../components/AllNotesModal'
import StudyTimerModal from '../components/StudyTimerModal'
import './Dashboard.css'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [todayStudyTime, setTodayStudyTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAllNotes, setShowAllNotes] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load profile (or create a default one if missing)
      try {
        const profileData = await getProfile(user!.id)
        setProfile(profileData)
      } catch (error: any) {
        console.log('Profile not found, using default')
        // Use user email data as fallback
        setProfile({
          id: user!.id,
          email: user!.email || '',
          first_name: user!.user_metadata?.first_name || 'there',
          last_name: user!.user_metadata?.last_name || '',
          full_name: user!.user_metadata?.full_name || 'User',
          avatar_url: user!.user_metadata?.avatar_url || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      // Load courses
      const coursesData = await getCourses(user!.id)

      // Load progress for each course
      const coursesWithProgress = await Promise.all(
        coursesData.map(course => getCourseWithProgress(course.id, user!.id))
      )
      setCourses(coursesWithProgress)

      // Load today's study time
      const studyTime = await getTodayStudyTime(user!.id)
      setTodayStudyTime(studyTime)

      // Calculate streak
      const streakDays = await calculateUserStreak(user!.id)
      setStreak(streakDays)

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/auth'
    } catch (error) {
      console.error('❌ Sign out error:', error)
      window.location.href = '/auth'
    }
  }

  const handleCourseCreated = () => {
    setShowCreateModal(false)
    loadDashboardData() // Reload courses
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  const firstName = profile?.first_name || 'there'
  const greeting = getGreeting(firstName)

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">LUCERO</h1>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <span className="nav-icon">🏠</span>
            Home
          </Link>
          <button className="nav-item" onClick={() => setShowAllNotes(true)}>
            <span className="nav-icon">📝</span>
            Notes
          </button>
          <button className="nav-item" onClick={() => setShowTimer(true)}>
            <span className="nav-icon">⏱️</span>
            Timer
          </button>
        </nav>

        <div className="sidebar-courses">
          <div className="sidebar-section-header">
            <h3>Courses</h3>
            <button className="btn-icon-small" onClick={() => setShowCreateModal(true)}>+</button>
          </div>
          <div className="sidebar-course-list">
            {courses.map(course => (
              <Link key={course.id} to={`/course/${course.id}`} className="sidebar-course-item">
                <span className="course-dot" style={{ background: course.color }}></span>
                {course.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar-small">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{firstName}</span>
          </div>
          <button onClick={handleSignOut} className="btn-logout" title="Sign Out">
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-greeting">
            <h1>Hi {firstName}, <br />ready to <span className="highlight-text">crush it?</span></h1>
          </div>
          <div className="streak-display">
            <div className="streak-count">{streak} day streak,</div>
            <div className="streak-label">great work!</div>
            <img src="/horse-logo.png" alt="Mascot" className="streak-mascot" />
          </div>
        </header>

        {/* Hero / Upload Section */}
        <section className="hero-upload-section">
          <div className="upload-card">
            <img src="/horse-logo.png" alt="Upload" className="upload-mascot" />
            <h2>Create a new course to get started!</h2>
            <p>We will help you organize your learning journey.</p>
            <button className="btn-black" onClick={() => setShowCreateModal(true)}>
              Create Course
            </button>
          </div>
        </section>

        {/* Courses Section */}
        <section className="courses-section">
          <div className="section-header">
            <h2>Courses</h2>
            <div className="header-actions">
              <button className="btn-outline" onClick={() => setShowCreateModal(true)}>+ Course</button>
            </div>
          </div>

          <div className="courses-list-horizontal">
            {courses.length === 0 ? (
              <div className="empty-courses-text">No courses yet. Create one above!</div>
            ) : (
              courses.map(course => (
                <div key={course.id} className="course-list-item" onClick={() => navigate(`/course/${course.id}`)}>
                  <div className="course-icon-wrapper">
                    <div className="course-icon" style={{ background: course.color }}>
                      {course.title.charAt(0)}
                    </div>
                  </div>
                  <div className="course-info">
                    <h3>{course.title}</h3>
                    <div className="course-meta">
                      <span>{course.subject}</span>
                      <span className="bullet">•</span>
                      <span>{new Date(course.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="course-arrow">→</div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCourseCreated}
        />
      )}

      {showAllNotes && user && (
        <AllNotesModal
          userId={user.id}
          onClose={() => setShowAllNotes(false)}
          onOpenNote={(courseId, noteId) => {
            setShowAllNotes(false)
            navigate(`/course/${courseId}`)
          }}
        />
      )}

      {showTimer && (
        <StudyTimerModal
          onClose={() => setShowTimer(false)}
        />
      )}
    </div>
  )
}