import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="nav-content">
          <h1 className="logo">LUCERO</h1>
          <div className="nav-links">
            <Link to="/auth" className="nav-link">Log In</Link>
            <Link to="/auth" className="nav-button">Start Now</Link>
          </div>
        </div>
      </nav>

      <main className="home-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Get better grades in <br />
              <span className="highlight-text">less time</span>
            </h1>
            <p className="hero-subtitle">
              Turn your study material into notes and exercises designed
              to help you learn more, faster.
            </p>
            <Link to="/auth" className="cta-button">Try Lucero now</Link>

            <div className="hero-illustration">
              <div className="bunny-mascot">🐰</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <h2>Focus starts <br />with <span className="highlight-circle">structure</span></h2>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📝</div>
              <h3>Notes</h3>
            </div>
            <div className="feature-item">
              <div className="feature-icon">❓</div>
              <h3>Quizzes</h3>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🗂️</div>
              <h3>Flashcards</h3>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracker</h3>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <h3>AI Chat</h3>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <h3>Study Group</h3>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="section-header">
            <h2>Impressively easy</h2>
            <p>Upload your material. Lucero creates notes, flashcards, quizzes. Then you see what needs improvement.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <h3>1. Upload PDF</h3>
              <div className="step-image upload-image">📄</div>
            </div>
            <div className="step-card">
              <h3>2. Study</h3>
              <div className="step-image study-image">🧠</div>
            </div>
            <div className="step-card">
              <h3>3. Improve</h3>
              <div className="step-image improve-image">📈</div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="testimonial-section">
          <div className="testimonial-content">
            <blockquote>
              "It's actually kind of become an inside joke in our study group that
              no one ever studies alone — it's always with <span className="highlight-orange">Lucero</span>."
            </blockquote>
            <div className="testimonial-author">
              <p>Student at Copenhagen Business School</p>
              <div className="bunny-friends">🐰🐰</div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="footer-cta">
          <div className="cta-content">
            <h2>Meet the future <br />of note-taking</h2>
            <p>Lucero refines your notes, connects topics, and builds a structured summary — the Golden Note that grows with every study session.</p>
            <Link to="/auth" className="cta-button-white">Start Learning Now</Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">LUCERO</div>
          <div className="footer-links">
            <Link to="/terms">Terms of Use</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <p className="copyright">&copy; 2024 LUCERO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

