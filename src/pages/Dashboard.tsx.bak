import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { getProfile, getCourses, getTodayStudyTime, getCourseWithProgress } from '../services/api'
import { Profile, CourseWithProgress } from '../types'
import { getGreeting, formatTime, getMotivationalQuote, calculateStreak } from '../utils/helpers'
import CreateCourseModal from '../components/CreateCourseModal'
import CourseCard from '../components/CourseCard'
import './Dashboard.css'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [todayStudyTime, setTodayStudyTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
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
      const streakDays = calculateStreak()
      setStreak(streakDays)
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    console.log('🚪 Signing out...')
    try {
      await signOut()
      console.log('✅ Sign out successful')
      // Force redirect with window.location for reliable logout
      window.location.href = '/auth'
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // Force redirect anyway
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
  const quote = getMotivationalQuote()
  
  // Calculate stats
  const totalCourses = courses.length
  const completedCourses = courses.filter(c => c.progress_percentage === 100).length
  const inProgressCourses = courses.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length
  
  // Get continue learning course (most recent with progress)
  const continueLearningCourse = courses
    .filter(c => c.progress_percentage > 0 && c.progress_percentage < 100)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

  return (
    <div className="dashboard-page">
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-left">
          <h1 className="nav-logo">LUCERO</h1>
        </div>
        <div className="nav-right">
          <div className="nav-search">
            <input type="text" placeholder="Search courses..." />
            <span className="search-icon">🔍</span>
          </div>
          <button className="nav-icon-btn" title="Notifications">
            🔔
            <span className="notification-badge">3</span>
          </button>
          <div className="user-menu">
            <button className="user-button">
              <div className="user-avatar">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <span>{firstName}</span>
            </button>
            <div className="user-dropdown">
              <Link to="/profile">Profile</Link>
              <Link to="/settings">Settings</Link>
              <button onClick={handleSignOut}>Sign Out</button>
            </div>
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
            🔥 {streak} day streak
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
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{inProgressCourses}</h3>
              <p>In Progress</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{completedCourses}</h3>
              <p>Completed</p>
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
                  <span>{continueLearningCourse.progress_percentage}% Complete</span>
                  <span>{continueLearningCourse.completed_lessons} / {continueLearningCourse.total_lessons} Lessons</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${continueLearningCourse.progress_percentage}%` }}
                  ></div>
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
            <button className="tool-card">
              <span className="tool-icon">📝</span>
              <span className="tool-name">Notes</span>
            </button>
            <button className="tool-card">
              <span className="tool-icon">🃏</span>
              <span className="tool-name">Flashcards</span>
            </button>
            <button className="tool-card">
              <span className="tool-icon">⏱️</span>
              <span className="tool-name">Study Timer</span>
            </button>
          </div>
        </section>
      </main>

      {/* Create Course Modal */}
      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCourseCreated}
        />
      )}
    </div>
  )
}