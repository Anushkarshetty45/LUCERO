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
              <div className="bunny-mascot">🐴</div>
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

        {/* Comparison Section */}
        <section className="comparison-section">
          <div className="section-header">
            <h2>Built for studying</h2>
            <p>Unlike other tools, Lucero is designed for students - and has everything you need.</p>
          </div>

          <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Features</th>
                  <th className="highlight-col">Lucero</th>
                  <th>NotebookLM</th>
                  <th>ChatGPT</th>
                  <th>Quizlet</th>
                  <th>Notion</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Shared Notes</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="check">✔</span></td>
                </tr>
                <tr>
                  <td>Quizzes / Flashcards</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                </tr>
                <tr>
                  <td>Course Overview</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                </tr>
                <tr>
                  <td>AI Chat</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="check">✔</span></td>
                  <td><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                </tr>
                <tr>
                  <td>Exam Simulator</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                </tr>
                <tr>
                  <td>Made for</td>
                  <td className="highlight-col">Students</td>
                  <td>Research</td>
                  <td>Everyone</td>
                  <td>Students</td>
                  <td>Everyone</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="comparison-cta">
            <Link to="/auth" className="cta-button-black">Try it for yourself</Link>
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

        {/* Pricing Section */}
        <section className="pricing-section">
          <div className="section-header">
            <h2>Select a plan to get started</h2>
            <div className="pricing-toggle">
              <span className="toggle-option active">Annual 50% off</span>
              <span className="toggle-option">Monthly</span>
            </div>
          </div>

          <div className="pricing-grid">
            {/* Starter Plan */}
            <div className="pricing-card">
              <div className="card-header">
                <h3>Starter</h3>
                <p>Great to start your journey</p>
              </div>
              <div className="price-display">
                <span className="amount">Free</span>
                <span className="period">Forever</span>
              </div>
              <Link to="/auth" className="pricing-button outline">Get started</Link>
              <ul className="features-list">
                <li><span className="check-icon">✔</span> Access to all features</li>
                <li><span className="check-icon">✔</span> Only 5 uploads and 30 AI chats per month</li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card featured">
              <div className="card-header">
                <h3>Pro</h3>
                <p>To ace your exams and save money</p>
              </div>
              <div className="price-display">
                <span className="currency">$</span>
                <span className="amount">4.99</span>
                <span className="period">/month</span>
              </div>
              <p className="billing-info">$59.99 billed annually</p>
              <Link to="/auth" className="pricing-button solid">Get started</Link>
              <ul className="features-list">
                <li><span className="check-icon">✔</span> Unlimited notes</li>
                <li><span className="check-icon">✔</span> Unlimited exercises</li>
                <li><span className="check-icon">✔</span> Unlimited uploads</li>
                <li><span className="check-icon">✔</span> Unlimited AI chat</li>
              </ul>
              <div className="card-illustration">
                <div className="bunny-mascot-small">🐴</div>
              </div>
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
              <div className="bunny-friends">🐴🐴</div>
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

