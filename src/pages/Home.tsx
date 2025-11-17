import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home-page">
      <nav className="home-nav">
        <h1>LUCERO</h1>
        <Link to="/auth" className="nav-button">Get Started</Link>
      </nav>
      
      <main className="home-content">
        <div className="hero-section">
          <h1 className="hero-title">Your Learning Journey Begins Here</h1>
          <p className="hero-subtitle">
            Unlock your potential with personalized learning experiences designed for success.
          </p>
          <Link to="/auth" className="cta-button">Start Learning Now</Link>
        </div>

        <div className="features-section">
          <div className="feature">
            <div className="feature-icon">📚</div>
            <h3>Comprehensive Courses</h3>
            <p>Access a wide range of courses designed by experts</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <h3>Track Progress</h3>
            <p>Monitor your learning journey and achievements</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon">🚀</div>
            <h3>Learn at Your Pace</h3>
            <p>Flexible learning that fits your schedule</p>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>&copy; 2024 LUCERO. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/terms">Terms of Use</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}

