import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <h1>LUCERO</h1>
        <div className="nav-right">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleSignOut} className="signout-button">
            Sign Out
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome back!</h2>
          <p>Continue your learning journey</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📚 My Courses</h3>
            <p>View and manage your enrolled courses</p>
            <button className="card-button">View Courses</button>
          </div>

          <div className="dashboard-card">
            <h3>📈 Progress</h3>
            <p>Track your learning progress and achievements</p>
            <button className="card-button">View Progress</button>
          </div>

          <div className="dashboard-card">
            <h3>🎯 Goals</h3>
            <p>Set and manage your learning goals</p>
            <button className="card-button">Set Goals</button>
          </div>

          <div className="dashboard-card">
            <h3>👤 Profile</h3>
            <p>Update your profile and preferences</p>
            <button className="card-button">Edit Profile</button>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">✓</span>
              <div>
                <p className="activity-title">Account Created</p>
                <p className="activity-time">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

