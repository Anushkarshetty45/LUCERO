// FORCE RECOMPILE - VERSION 2
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getProfile, getCourses, getTodayStudyTime, getCourseWithProgress, recordDailyActivity } from '../services/api'
import { cancelSubscription } from '../services/razorpay'
import { supabase } from '../services/supabase'
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
import UpgradeModal from '../components/UpgradeModal'
import { useTimerContext } from '../contexts/TimerContext'
import { useLiveStudy } from '../contexts/LiveStudyContext'
import { useStudyReminder } from '../hooks/useStudyReminder'
import { IoBookSharp, IoTimer } from 'react-icons/io5'
import './Dashboard.css'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [paymentBanner, setPaymentBanner] = useState<'success' | 'cancelled' | null>(null)
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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMigrationWarning, setShowMigrationWarning] = useState(false)
  const [showPlanMenu, setShowPlanMenu] = useState(false)
  const [cancellingSubscription, setCancellingSubscription] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelMessage, setCancelMessage] = useState('')

  // Use timer context for app-level timer state
  const { timer, setIsMinimized, showTimerModal, setShowTimerModal } = useTimerContext()
  const { setShowLiveStudy } = useLiveStudy()
  const { limits, setCourseCount, markTrialUsed, refreshProfile } = useSubscription()

  // Enable study reminders
  const { testNotification } = useStudyReminder(user?.id)

  // Expose test notification to window for debugging
  useEffect(() => {
    if (testNotification) {
      (window as any).testNotification = testNotification
      console.log('💡 Tip: Type testNotification() in console to test notifications!')
    }
  }, [testNotification])

  // Handle Stripe redirect back to dashboard
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      setPaymentBanner('success')
      navigate('/dashboard', { replace: true })
      setTimeout(() => setPaymentBanner(null), 6000)
    } else if (payment === 'cancelled') {
      setPaymentBanner('cancelled')
      navigate('/dashboard', { replace: true })
      setTimeout(() => setPaymentBanner(null), 4000)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open payment modal if user came from "Get started Pro" on landing page
  useEffect(() => {
    if (!user || loading) return
    const pendingPlan = localStorage.getItem('lucero-pending-plan')
    if (pendingPlan === 'pro' && !limits.isPro) {
      localStorage.removeItem('lucero-pending-plan')
      setShowUpgradeModal(true)
    }
  }, [user, loading, limits.isPro])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Refresh study time every 60 seconds to pick up timer sessions
  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      try {
        const studyTime = await getTodayStudyTime(user.id)
        setTodayStudyTime(studyTime)
      } catch (err) {
        // Silently ignore refresh errors
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showProfileMenu && !target.closest('.user-menu')) {
        setShowProfileMenu(false)
      }
      if (showPlanMenu && !target.closest('.plan-menu')) {
        setShowPlanMenu(false)
        setCancelConfirm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu, showPlanMenu])

  const loadDashboardData = async () => {
    try {
      // Fire-and-forget: record login activity without blocking the UI
      recordDailyActivity(user!.id, 'login').catch((activityError: any) => {
        if (activityError?.message?.includes('daily_activities') ||
            activityError?.code === '42P01') {
          setShowMigrationWarning(true)
        }
      })

      // Parallelize all independent API calls for faster loading
      const [profileResult, coursesData, studyTime] = await Promise.all([
        // Load profile with fallback
        getProfile(user!.id).catch((error) => {
          console.error('⚠️ Profile load error:', error)
          return {
            id: user!.id,
            email: user!.email || '',
            first_name: user!.user_metadata?.given_name || user!.user_metadata?.first_name || user!.user_metadata?.name?.split(' ')[0] || localStorage.getItem('lucero-signup-name')?.split(' ')[0] || user!.email?.split('@')[0] || 'there',
            last_name: user!.user_metadata?.family_name || user!.user_metadata?.last_name || localStorage.getItem('lucero-signup-name')?.split(' ').slice(1).join(' ') || '',
            full_name: user!.user_metadata?.full_name || user!.user_metadata?.name || localStorage.getItem('lucero-signup-name') || user!.email?.split('@')[0] || 'User',
            avatar_url: user!.user_metadata?.avatar_url || user!.user_metadata?.picture || '',
            subscription_plan: 'free' as const,
            subscription_status: 'active' as const,
            monthly_pdf_uploads: 0,
            monthly_ai_messages: 0,
            usage_reset_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }),
        // Load courses
        getCourses(user!.id),
        // Load today's study time
        getTodayStudyTime(user!.id).catch(() => 0)
      ])

      setProfile(profileResult)
      setTodayStudyTime(studyTime)
      localStorage.removeItem('lucero-signup-name')

      // Show courses immediately with basic data (no spinner waiting for progress)
      setCourses(coursesData.map(course => ({ ...course, total_lessons: 0, last_accessed: null })))
      setCourseCount(coursesData.length)

      // Hide loading screen early
      setLoading(false)

      // Load all course lesson counts in ONE batch query (not N separate queries)
      if (coursesData.length > 0) {
        const courseIds = coursesData.map(c => c.id)
        const { data: allLessons } = await supabase
          .from('lessons')
          .select('id, course_id')
          .in('course_id', courseIds)

        // Count lessons per course in memory
        const lessonCountMap: Record<string, number> = {}
        allLessons?.forEach((lesson: { id: string; course_id: string }) => {
          lessonCountMap[lesson.course_id] = (lessonCountMap[lesson.course_id] || 0) + 1
        })

        setCourses(coursesData.map(course => ({
          ...course,
          total_lessons: lessonCountMap[course.id] || 0,
          last_accessed: (course as any).last_accessed || null
        })))
      }

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

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true)
    try {
      const message = await cancelSubscription()
      setCancelMessage(message)
      setCancelConfirm(false)
      await refreshProfile()
    } catch (err: any) {
      setCancelMessage(err.message || 'Failed to cancel. Please try again.')
      setCancelConfirm(false)
    }
    setCancellingSubscription(false)
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

  const handleLiveStudyClick = () => {
    if (!limits.isPro && !limits.canTryLiveStudy) {
      setShowUpgradeModal(true)
      return
    }
    setShowLiveStudy(true)
  }

  const handleGroupStudyClick = () => {
    if (!limits.isPro && !limits.canTryGroupStudy) {
      setShowUpgradeModal(true)
      return
    }
    setShowGroupStudy(true)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  const firstName = profile?.first_name || user?.user_metadata?.given_name || user?.user_metadata?.name?.split(' ')[0] || 'there'
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
      {/* Payment banners */}
      {paymentBanner === 'success' && (
        <div className="payment-banner payment-banner--success">
          🎉 Welcome to Pro! Your subscription is now active.
          <button onClick={() => setPaymentBanner(null)}>✕</button>
        </div>
      )}
      {paymentBanner === 'cancelled' && (
        <div className="payment-banner payment-banner--cancelled">
          Payment cancelled. You can upgrade anytime.
          <button onClick={() => setPaymentBanner(null)}>✕</button>
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

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
          <button className="sidebar-nav-item" onClick={handleGroupStudyClick}>
            <span className="nav-icon">🎥</span>
            {t('nav.groupStudy')}
          </button>
          <button className="sidebar-nav-item" onClick={handleLiveStudyClick}>
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

        {/* Daily usage tracker */}
        {!limits.isPro && (
          <div className="sidebar-usage">
            <div className="sidebar-usage-header">
              <span className="sidebar-usage-title">Today's Usage</span>
              <button className="sidebar-usage-upgrade" onClick={() => setShowUpgradeModal(true)}>Upgrade</button>
            </div>
            <div className="usage-rows">
              <div className="usage-row">
                <span className="usage-label">📝 Notes</span>
                <span className={`usage-count ${limits.remainingNotes === 0 ? 'usage-exhausted' : ''}`}>
                  {limits.remainingNotes === 0 ? 'Done' : `${limits.remainingNotes} left`}
                </span>
              </div>
              <div className="usage-row">
                <span className="usage-label">📄 PDFs</span>
                <span className={`usage-count ${limits.remainingPDFUploads === 0 ? 'usage-exhausted' : ''}`}>
                  {limits.remainingPDFUploads === 0 ? 'Done' : `${limits.remainingPDFUploads} left`}
                </span>
              </div>
              <div className="usage-row">
                <span className="usage-label">💬 AI Chat</span>
                <span className={`usage-count ${limits.remainingAIMessages === 0 ? 'usage-exhausted' : ''}`}>
                  {limits.remainingAIMessages === 0 ? 'Done' : `${limits.remainingAIMessages} left`}
                </span>
              </div>
              <div className="usage-row">
                <span className="usage-label">🃏 Flashcards</span>
                <span className={`usage-count ${limits.remainingFlashcards === 0 ? 'usage-exhausted' : ''}`}>
                  {limits.remainingFlashcards === 0 ? 'Done' : `${limits.remainingFlashcards} left`}
                </span>
              </div>
              <div className="usage-row">
                <span className="usage-label">📋 Quizzes</span>
                <span className={`usage-count ${limits.remainingQuizzes === 0 ? 'usage-exhausted' : ''}`}>
                  {limits.remainingQuizzes === 0 ? 'Done' : `${limits.remainingQuizzes} left`}
                </span>
              </div>
              <div className="usage-row">
                <span className="usage-label">🎥 Group Study</span>
                <span className={`usage-count ${!limits.canTryGroupStudy ? 'usage-exhausted' : 'usage-trial'}`}>
                  {limits.canTryGroupStudy ? '1 trial' : 'Used'}
                </span>
              </div>
              <div className="usage-row">
                <span className="usage-label">📹 Live Study</span>
                <span className={`usage-count ${!limits.canTryLiveStudy ? 'usage-exhausted' : 'usage-trial'}`}>
                  {limits.canTryLiveStudy ? '1 trial' : 'Used'}
                </span>
              </div>
            </div>
          </div>
        )}

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
            {limits.isPro ? (
              <div className="plan-menu">
                <button className="plan-badge plan-badge-pro" onClick={() => { setShowPlanMenu(p => !p); setCancelConfirm(false); setCancelMessage('') }}>
                  ⚡ Pro
                </button>
                {showPlanMenu && (
                  <div className="plan-dropdown">
                    <div className="plan-dropdown-header">
                      <span className="plan-dropdown-badge">⚡ Pro Plan</span>
                      <p className="plan-dropdown-sub">Unlimited access to all features</p>
                    </div>
                    <div className="plan-dropdown-divider" />
                    {cancelMessage ? (
                      <p className="plan-dropdown-msg">{cancelMessage}</p>
                    ) : !cancelConfirm ? (
                      <button className="plan-dropdown-cancel" onClick={() => setCancelConfirm(true)}>
                        Cancel Subscription
                      </button>
                    ) : (
                      <div className="plan-dropdown-confirm">
                        <p>Cancel your Pro subscription?<br/><small>You'll keep access until the billing period ends.</small></p>
                        <div className="plan-dropdown-confirm-actions">
                          <button className="plan-btn-confirm-yes" onClick={handleCancelSubscription} disabled={cancellingSubscription}>
                            {cancellingSubscription ? 'Cancelling…' : 'Yes, cancel'}
                          </button>
                          <button className="plan-btn-confirm-no" onClick={() => setCancelConfirm(false)} disabled={cancellingSubscription}>
                            Keep Pro
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button className="plan-badge plan-badge-free" onClick={() => setShowUpgradeModal(true)}>
                Free — Upgrade
              </button>
            )}
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
              <button className="tool-card" onClick={handleGroupStudyClick}>
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
          currentCourseCount={courses.length}
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
          onSessionStarted={limits.isPro ? undefined : () => markTrialUsed('group_study')}
        />
      )}
    </div>
  )
}