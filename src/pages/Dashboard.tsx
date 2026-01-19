// FORCE RECOMPILE - VERSION 2
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getProfile, getCourses, getTodayStudyTime, getCourseWithProgress, recordDailyActivity, getUserStreak } from '../services/api'
import { Profile, CourseWithProgress } from '../types'
import { getGreeting, formatTime, getMotivationalQuote } from '../utils/helpers'
import CreateCourseModal from '../components/CreateCourseModal'
import CourseCard from '../components/CourseCard'
import AllNotesModal from '../components/AllNotesModal'
import StudyTimerModal from '../components/StudyTimerModal'
import ChatbotModal from '../components/ChatbotModal'
import PDFAnalyzerModal from '../components/PDFAnalyzer/PDFAnalyzerModal'
import FlashcardsModal from '../components/FlashcardsModal'
import GroupStudyModal from '../components/GroupStudyModal'
import { useTimerContext } from '../contexts/TimerContext'
import { useLiveStudy } from '../contexts/LiveStudyContext'
import { useStudyReminder } from '../hooks/useStudyReminder'
import { IoBookSharp, IoFlame, IoTimer } from 'react-icons/io5'
import './Dashboard.css'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [todayStudyTime, setTodayStudyTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAllNotes, setShowAllNotes] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [showPDFAnalyzer, setShowPDFAnalyzer] = useState(false)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [showGroupStudy, setShowGroupStudy] = useState(false)
  const [streak, setStreak] = useState(0)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMigrationWarning, setShowMigrationWarning] = useState(false)

  // Use timer context for app-level timer state
  const { timer, setIsMinimized, showTimerModal, setShowTimerModal } = useTimerContext()
  const { setShowLiveStudy } = useLiveStudy()

  // Enable study reminders
  const { testNotification } = useStudyReminder(user?.id)

  // Expose test notification to window for debugging
  useEffect(() => {
    if (testNotification) {
      (window as any).testNotification = testNotification
      console.log('💡 Tip: Type testNotification() in console to test notifications!')
    }
  }, [testNotification])

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
      // Record daily login activity FIRST - check if migration is needed
      try {
        await recordDailyActivity(user!.id, 'login')
      } catch (activityError: any) {
        // Check if error is due to missing table
        if (activityError?.message?.includes('daily_activities') ||
            activityError?.code === '42P01') {
          setShowMigrationWarning(true)
          console.error('⚠️ Database migration needed! Please run the migration in Supabase.')
        }
      }

      // Parallelize all independent API calls for faster loading
      const [profileResult, coursesData, studyTime, streakData] = await Promise.all([
        // Load profile with fallback
        getProfile(user!.id).catch((error) => {
          console.error('⚠️ Profile load error:', error)
          // Use data from auth user as fallback
          return {
            id: user!.id,
            email: user!.email || '',
            first_name: user!.user_metadata?.first_name || user!.email?.split('@')[0] || 'there',
            last_name: user!.user_metadata?.last_name || '',
            full_name: user!.user_metadata?.full_name || user!.email?.split('@')[0] || 'User',
            avatar_url: user!.user_metadata?.avatar_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }),
        // Load courses
        getCourses(user!.id),
        // Load today's study time
        getTodayStudyTime(user!.id).catch(() => 0),
        // Get user streak (updated by recordDailyActivity above)
        getUserStreak(user!.id).catch(() => ({ current: 0, longest: 0 }))
      ])

      console.log('📋 Profile loaded:', profileResult)

      setProfile(profileResult)
      setTodayStudyTime(studyTime)
      setStreak(streakData.current)

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
            {t('nav.home')}
          </Link>
          <button className="sidebar-nav-item" onClick={() => setShowChatbot(true)}>
            <span className="nav-icon">💬</span>
            {t('nav.chat')}
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowAllNotes(true)}>
            <span className="nav-icon">📝</span>
            {t('nav.notes')}
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowTimerModal(true)}>
            <span className="nav-icon">⏱️</span>
            {t('nav.timer')}
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowPDFAnalyzer(true)}>
            <span className="nav-icon">📄</span>
            {t('nav.pdfAnalyzer')}
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowGroupStudy(true)}>
            <span className="nav-icon">🎥</span>
            {t('nav.groupStudy')}
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowLiveStudy(true)}>
            <span className="nav-icon">📹</span>
            {t('nav.liveStudy')}
          </button>
        </nav>

        <div className="sidebar-courses">
          <div className="sidebar-courses-header">
            <h3>{t('dashboard.myCourses')}</h3>
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
            <div className="user-menu">
              <button className="user-button" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="user-avatar">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <span>{firstName}</span>
              </button>
              {showProfileMenu && (
                <div className="user-dropdown">
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)}>{t('nav.profile')}</Link>
                  <Link to="/settings" onClick={() => setShowProfileMenu(false)}>{t('nav.settings')}</Link>
                  <button onClick={handleSignOut}>{t('nav.signOut')}</button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="dashboard-content">
          {/* Migration Warning Banner */}
          {showMigrationWarning && (
            <div className="migration-warning-banner">
              <div className="warning-content">
                <span className="warning-icon">⚠️</span>
                <div className="warning-text">
                  <strong>Database Migration Required</strong>
                  <p>Your streak and study time features need a database update. Please check the <code>RUN_THIS_MIGRATION.md</code> file in your project folder for instructions.</p>
                </div>
                <button
                  className="btn-dismiss-warning"
                  onClick={() => setShowMigrationWarning(false)}
                  aria-label="Dismiss warning"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-text">
              <h2>{greeting}</h2>
              <p>{quote}</p>
            </div>
            <div className="streak-badge">
              {t('dashboard.dayStreakLabel', { count: streak })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon"><IoBookSharp /></div>
              <div className="stat-content">
                <h3>{totalCourses}</h3>
                <p>{t('dashboard.totalCourses')}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><IoFlame /></div>
              <div className="stat-content">
                <h3>{streak}</h3>
                <p>{t('dashboard.dayStreak')}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><IoTimer /></div>
              <div className="stat-content">
                <h3>{formatTime(todayStudyTime)}</h3>
                <p>{t('dashboard.todayStudyTime')}</p>
              </div>
            </div>
          </div>

          {/* Continue Learning */}
          {continueLearningCourse && (
            <section className="dashboard-section">
              <h3 className="section-title">{t('dashboard.continueLearning')}</h3>
              <div className="continue-learning-card">
                <div className="continue-card-header" style={{ background: continueLearningCourse.color }}>
                  <h4>{continueLearningCourse.title}</h4>
                  <span className="course-subject">{continueLearningCourse.subject}</span>
                </div>
                <div className="continue-card-body">
                  <div className="progress-info">
                    <span> {continueLearningCourse.total_lessons} {t('course.topics')}</span>
                    <span>🕒 {t('dashboard.lastStudied')}: {new Date(continueLearningCourse.last_accessed!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <button
                    className="btn-continue"
                    onClick={() => navigate(`/course/${continueLearningCourse.id}`)}
                  >
                    {t('dashboard.continueLearning')} →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* My Courses */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">{t('dashboard.myCourses')}</h3>
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                + {t('dashboard.createCourse')}
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>{t('dashboard.noCourses')}</h3>
                <p>{t('dashboard.createFirstCourse')}</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  {t('dashboard.createCourse')}
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
            <h3 className="section-title">{t('dashboard.studyTools')}</h3>
            <div className="tools-grid">
              <button className="tool-card" onClick={() => setShowPDFAnalyzer(true)}>
                <span className="tool-icon">📄</span>
                <span className="tool-name">{t('dashboard.tools.pdfAnalyzer')}</span>
                <span className="tool-badge new">{t('dashboard.tools.new')}</span>
              </button>
              <button className="tool-card" onClick={() => setShowGroupStudy(true)}>
                <span className="tool-icon">🎥</span>
                <span className="tool-name">{t('dashboard.tools.groupStudy')}</span>
                <span className="tool-badge new">{t('dashboard.tools.new')}</span>
              </button>
              <button className="tool-card" onClick={() => setShowAllNotes(true)}>
                <span className="tool-icon">📝</span>
                <span className="tool-name">{t('dashboard.tools.notes')}</span>
              </button>
              <button className="tool-card" onClick={() => setShowFlashcards(true)}>
                <span className="tool-icon">🃏</span>
                <span className="tool-name">{t('dashboard.tools.flashcards')}</span>
              </button>
              <button className="tool-card" onClick={() => setShowTimerModal(true)}>
                <span className="tool-icon">⏱️</span>
                <span className="tool-name">{t('dashboard.tools.studyTimer')}</span>
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

      {showPDFAnalyzer && (
        <PDFAnalyzerModal
          onClose={() => setShowPDFAnalyzer(false)}
        />
      )}

      {showFlashcards && user && (
        <FlashcardsModal
          userId={user.id}
          onClose={() => setShowFlashcards(false)}
        />
      )}

      {showGroupStudy && (
        <GroupStudyModal
          onClose={() => setShowGroupStudy(false)}
        />
      )}
    </div>
  )
}