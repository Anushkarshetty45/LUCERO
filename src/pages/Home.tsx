import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import './Home.css'

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    }, { threshold: 0.1 })

    const hiddenElements = document.querySelectorAll('.animate-on-scroll')
    hiddenElements.forEach((el) => observer.observe(el))

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      question: "What are the limits of Lucero?",
      answer: "The free plan includes 5 uploads and 30 AI chat messages per month. The Pro plan offers unlimited uploads, notes, exercises, and AI chat for just $4.99/month."
    },
    {
      question: "How is Lucero AI different from other AI models?",
      answer: "Lucero is specifically designed for students and learning. Unlike general AI models, it organizes your study materials into structured notes, creates personalized quizzes, and builds a comprehensive Golden Note that grows with your learning journey."
    },
    {
      question: "What do I do if something doesn't work?",
      answer: "If you encounter any issues, please contact our support team at support@lucero.com. We're here to help 24/7 and typically respond within a few hours."
    },
    {
      question: "Can Lucero help me with the exams?",
      answer: "Absolutely! Lucero creates exam-style practice questions, provides instant feedback, and helps you identify weak areas before test day. Our exam simulator mimics real test conditions to prepare you thoroughly."
    },
    {
      question: "How does Lucero protect my data?",
      answer: "We take data security seriously. All your notes and materials are encrypted in transit and at rest. We never share your data with third parties, and you can delete your account and all associated data at any time."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription anytime from your account settings. Simply go to Settings > Subscription > Cancel. You'll retain access until the end of your billing period."
    },
    {
      question: "Does Lucero work in my language?",
      answer: "Lucero currently supports English, Spanish, French, German, Italian, Portuguese, and Chinese. We're constantly adding more languages based on user demand."
    }
  ]
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
          <div className="hero-content animate-on-scroll">
            <h1 className="hero-title">
              Get better grades in <br />
              <span className="highlight-text">less time</span>
            </h1>
            <p className="hero-subtitle">
              Transform your study materials into comprehensive, AI-powered notes and interactive exercises.
              Lucero helps you master any subject faster with personalized learning paths, smart quizzes,
              and real-time progress tracking.
            </p>
            <Link to="/auth" className="cta-button">Try Lucero now</Link>

            <div className="hero-illustration">
              <img src="/horse-mascot.png" alt="Lucero Horse Mascot" className="horse-mascot" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <h2>Focus starts <br />with <span className="highlight-circle">structure</span></h2>
          </div>

          <div className="features-grid">
            <div className="feature-item animate-on-scroll delay-100">
              <div className="feature-icon">📝</div>
              <h3>Smart Notes</h3>
              <p>AI-generated comprehensive notes from your study materials</p>
            </div>
            <div className="feature-item animate-on-scroll delay-200">
              <div className="feature-icon">❓</div>
              <h3>Adaptive Quizzes</h3>
              <p>Test your knowledge with intelligent, personalized quizzes</p>
            </div>
            <div className="feature-item animate-on-scroll delay-300">
              <div className="feature-icon">🗂️</div>
              <h3>Flashcards</h3>
              <p>Create and review flashcards for efficient memorization</p>
            </div>
            <div className="feature-item animate-on-scroll delay-100">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracker</h3>
              <p>Monitor your learning journey with detailed analytics</p>
            </div>
            <div className="feature-item animate-on-scroll delay-200">
              <div className="feature-icon">🤖</div>
              <h3>AI Chat Assistant</h3>
              <p>Get instant answers to your study questions 24/7</p>
            </div>
            <div className="feature-item animate-on-scroll delay-300">
              <div className="feature-icon">👥</div>
              <h3>Study Groups</h3>
              <p>Collaborate with classmates and share resources</p>
            </div>
          </div>
        </section>

        {/* University Logos Section */}
        <section className="universities-section">
          <p className="universities-label">Over 100,000 students use Lucero</p>
          <div className="universities-logos">
            <div className="university-logo">Berkeley</div>
            <div className="university-logo">Oxford</div>
            <div className="university-logo">MIT</div>
            <div className="university-logo">Stanford</div>
            <div className="university-logo">Harvard</div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="benefits-section">
          <div className="section-header">
            <h2>Why students love Lucero</h2>
            <p>Join thousands of students who are achieving their academic goals faster</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card animate-on-scroll delay-100">
              <div className="benefit-icon">⚡</div>
              <h3>Save Time</h3>
              <p>Reduce study time by up to 50% with AI-powered note generation and smart learning paths tailored to your needs.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-200">
              <div className="benefit-icon">🎯</div>
              <h3>Better Retention</h3>
              <p>Proven spaced repetition techniques and active recall methods help you remember more and forget less.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-300">
              <div className="benefit-icon">📈</div>
              <h3>Track Progress</h3>
              <p>Visualize your improvement with detailed analytics, performance insights, and personalized recommendations.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-100">
              <div className="benefit-icon">🌟</div>
              <h3>Ace Your Exams</h3>
              <p>Practice with exam-style questions, get instant feedback, and identify weak areas before test day.</p>
            </div>
          </div>
        </section>

        {/* Golden Note Section */}
        <section className="golden-note-section">
          <div className="golden-note-content">
            <div className="golden-note-text animate-on-scroll">
              <h2>Meet the future of note-taking</h2>
              <p className="golden-note-description">
                Lucero refines your notes, connects topics, and builds a structured summary
                — the <strong>Golden Note</strong> that grows with every study session.
              </p>

              <div className="golden-note-features">
                <div className="gn-feature">
                  <div className="gn-icon">📋</div>
                  <div>
                    <h4>Topics</h4>
                    <p>Lucero organizes your material by easy to understand topics.</p>
                  </div>
                </div>
                <div className="gn-feature">
                  <div className="gn-icon">✏️</div>
                  <div>
                    <h4>Note refinement</h4>
                    <p>Improve your messy notes with just one click.</p>
                  </div>
                </div>
                <div className="gn-feature">
                  <div className="gn-icon">📄</div>
                  <div>
                    <h4>Golden note</h4>
                    <p>Lucero pulls all your notes and materials into one simple, structured "cheat-sheet" — the Golden Note.</p>
                    <p className="gn-subtext">Share it with your study group, and everyone's notes combine into one Golden Note.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="golden-note-visual animate-on-scroll delay-200">
              <div className="gn-card gn-card-topics">
                <div className="gn-card-header">Topics</div>
                <div className="gn-card-body">Organized study material</div>
              </div>
              <div className="gn-card gn-card-refinement">
                <div className="gn-card-header">Note Refinement</div>
                <div className="gn-card-body">Enhanced notes</div>
              </div>
              <div className="gn-card gn-card-golden">
                <div className="gn-card-header">Golden Note for Corporate Finance</div>
                <div className="gn-card-body">Complete structured summary</div>
              </div>
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
            <div className="step-card animate-on-scroll delay-100">
              <h3>1. Upload PDF</h3>
              <div className="step-image upload-image">📄</div>
            </div>
            <div className="step-card animate-on-scroll delay-200">
              <h3>2. Study</h3>
              <div className="step-image study-image">🧠</div>
            </div>
            <div className="step-card animate-on-scroll delay-300">
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
            <div className="pricing-card animate-on-scroll delay-100">
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
            <div className="pricing-card featured animate-on-scroll delay-200">
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
                <img src="/horse-mascot.png" alt="Lucero Horse" className="horse-mascot-small" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="section-header">
            <h2>Still have questions?</h2>
          </div>

          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openFaq === index ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.question}</span>
                  <span className="faq-icon">{openFaq === index ? '−' : '+'}</span>
                </div>
                {openFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta-section">
          <h2>Curious? Try it for free</h2>
          <p>Join thousands of students already using Lucero to ace their exams</p>
          <Link to="/auth" className="cta-button-large">Start Learning Now</Link>
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
              <div className="bunny-friends">
                <img src="/horse-mascot.png" alt="Horse" className="horse-friend" />
              </div>
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

