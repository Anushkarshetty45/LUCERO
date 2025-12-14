// FORCE RECOMPILE - VERSION 2
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
import ChatbotModal from '../components/ChatbotModal'
import { useTimerContext } from '../contexts/TimerContext'
import { useLiveStudy } from '../contexts/LiveStudyContext'
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
  const [showChatbot, setShowChatbot] = useState(false)
  const [streak, setStreak] = useState(0)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Use timer context for app-level timer state
  const { timer, setIsMinimized, showTimerModal, setShowTimerModal } = useTimerContext()
  const { setShowLiveStudy } = useLiveStudy()

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showProfileMenu && !target.closest('.user-menu')) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  const loadDashboardData = async () => {
    try {
      // Parallelize all independent API calls for faster loading
      const [profileResult, coursesData, studyTime, streakDays] = await Promise.all([
        // Load profile with fallback
        getProfile(user!.id).catch(() => ({
          id: user!.id,
          email: user!.email || '',
          first_name: user!.user_metadata?.first_name || 'there',
          last_name: user!.user_metadata?.last_name || '',
          full_name: user!.user_metadata?.full_name || 'User',
          avatar_url: user!.user_metadata?.avatar_url || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })),
        // Load courses
        getCourses(user!.id),
        // Load today's study time
        getTodayStudyTime(user!.id),
        // Calculate streak
        calculateUserStreak(user!.id)
      ])

      setProfile(profileResult)
      setTodayStudyTime(studyTime)
      setStreak(streakDays)

      // Hide loading screen early to show UI faster
      setLoading(false)

      // Load progress for each course in background (progressive loading)
      const coursesWithProgress = await Promise.all(
        coursesData.map(course => getCourseWithProgress(course.id, user!.id))
      )
      setCourses(coursesWithProgress)

    } catch (error) {
      console.error('Error loading dashboard:', error)
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

  const handleTimerMinimize = () => {
    setIsMinimized(true)
    setShowTimerModal(false)
  }

  const handleTimerClose = () => {
    timer.resetTimer()
    setShowTimerModal(false)
    setIsMinimized(false)
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
  const quote = getMotivationalQuote()

  // Calculate stats
  const totalCourses = courses.length

  // Get continue learning course (most recently accessed)
  const continueLearningCourse = courses
    .filter(c => c.last_accessed !== null)
    .sort((a, b) => {
      const dateA = a.last_accessed ? new Date(a.last_accessed).getTime() : 0
      const dateB = b.last_accessed ? new Date(b.last_accessed).getTime() : 0
      return dateB - dateA
    })[0]

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">LUCERO</h1>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-nav-item active">
            <span className="nav-icon">🏠</span>
            Home
          </Link>
          <button className="sidebar-nav-item" onClick={() => setShowChatbot(true)}>
            <span className="nav-icon">💬</span>
            Chat
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowAllNotes(true)}>
            <span className="nav-icon">📝</span>
            Notes
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowTimerModal(true)}>
            <span className="nav-icon">⏱️</span>
            Timer
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowLiveStudy(true)}>
            <span className="nav-icon">📹</span>
            Live Study
          </button>
        </nav>

        <div className="sidebar-courses">
          <div className="sidebar-courses-header">
            <h3>Courses</h3>
            <button className="btn-add-course" onClick={() => setShowCreateModal(true)}>+</button>
          </div>
          <div className="sidebar-courses-list">
            {courses.map(course => (
              <Link key={course.id} to={`/course/${course.id}`} className="sidebar-course-link">
                <span className="course-color-dot" style={{ background: course.color }}></span>
                {course.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span className="sidebar-user-name">{firstName}</span>
          </div>
          <button onClick={handleSignOut} className="btn-sidebar-logout" title="Sign Out">
            🚪
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <div className="dashboard-page">
        {/* Navigation */}
        <nav className="dashboard-nav">
          <div className="nav-left">
            <h1 className="nav-logo">LUCERO</h1>
          </div>
          <div className="nav-right">
            <button className="nav-icon-btn" title="Notifications">
              🔔
              <span className="notification-badge">3</span>
            </button>
            <div className="user-menu">
              <button className="user-button" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="user-avatar">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <span>{firstName}</span>
              </button>
              {showProfileMenu && (
                <div className="user-dropdown">
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)}>Profile</Link>
                  <Link to="/settings" onClick={() => setShowProfileMenu(false)}>Settings</Link>
                  <button onClick={handleSignOut}>Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="dashboard-content">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-text">
              <h2>{greeting}</h2>
              <p>{quote}</p>
            </div>
            <div className="streak-badge">
               {streak} day streak
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <h3>{totalCourses}</h3>
                <p>Total Courses</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <h3>{streak}</h3>
                <p>Day Streak</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <h3>{formatTime(todayStudyTime)}</h3>
                <p>Today's Study Time</p>
              </div>
            </div>
          </div>

          {/* Continue Learning */}
          {continueLearningCourse && (
            <section className="dashboard-section">
              <h3 className="section-title">Continue Learning</h3>
              <div className="continue-learning-card">
                <div className="continue-card-header" style={{ background: continueLearningCourse.color }}>
                  <h4>{continueLearningCourse.title}</h4>
                  <span className="course-subject">{continueLearningCourse.subject}</span>
                </div>
                <div className="continue-card-body">
                  <div className="progress-info">
                    <span> {continueLearningCourse.total_lessons} Topics</span>
                    <span>🕒 Last studied: {new Date(continueLearningCourse.last_accessed!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <button
                    className="btn-continue"
                    onClick={() => navigate(`/course/${continueLearningCourse.id}`)}
                  >
                    Continue Learning →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* My Courses */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">My Courses</h3>
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                + Create Course
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No courses yet</h3>
                <p>Create your first course to start learning!</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onUpdate={loadDashboardData}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Study Tools */}
          <section className="dashboard-section">
            <h3 className="section-title">Study Tools</h3>
            <div className="tools-grid">
              <button className="tool-card">
                <span className="tool-icon">💭</span>
                <span className="tool-name">AI Assistant</span>
                <span className="tool-badge">Coming Soon</span>
              </button>
              <button className="tool-card" onClick={() => setShowAllNotes(true)}>
                <span className="tool-icon">📝</span>
                <span className="tool-name">Notes</span>
              </button>
              <button className="tool-card">
                <span className="tool-icon">🃏</span>
                <span className="tool-name">Flashcards</span>
                <span className="tool-badge">Coming Soon</span>
              </button>
              <button className="tool-card" onClick={() => setShowTimerModal(true)}>
                <span className="tool-icon">⏱️</span>
                <span className="tool-name">Study Timer</span>
              </button>
            </div>
          </section>
        </main>
      </div>

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
          onOpenNote={(courseId) => {
            setShowAllNotes(false)
            navigate(`/course/${courseId}`)
          }}
        />
      )}

      {showTimerModal && (
        <StudyTimerModal
          onClose={handleTimerClose}
          onMinimize={handleTimerMinimize}
          timer={timer}
        />
      )}

      {showChatbot && (
        <ChatbotModal
          onClose={() => setShowChatbot(false)}
        />
      )}
    </div>
  )
}