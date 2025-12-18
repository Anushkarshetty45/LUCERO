import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Home.css'
import ParticleBurst from '../components/ParticleBurst'
import {
  HiOutlineDocumentText,
  HiOutlineQuestionMarkCircle,
  HiOutlineSquare3Stack3D,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserGroup,
  HiOutlineBolt,
  HiOutlineLightBulb,
  HiOutlineArrowTrendingUp,
  HiOutlineTrophy,
  HiOutlineClipboardDocumentList,
  HiOutlinePencilSquare,
  HiOutlineSparkles,
  HiOutlineArrowUpTray,
  HiOutlineBookOpen,
  HiOutlineChartBarSquare
} from 'react-icons/hi2'

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isAnnual, setIsAnnual] = useState(true)

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
      answer: "Lucero is built for students. It organizes your study materials into structured notes, creates quizzes, and builds a Golden Note that summarizes everything."
    },
    {
      question: "What do I do if something doesn't work?",
      answer: "Email us at support@lucero.com and we'll help you out."
    },
    {
      question: "Can Lucero help me with the exams?",
      answer: "Yes. Lucero creates practice questions and shows you what topics need more work."
    },
    {
      question: "How does Lucero protect my data?",
      answer: "Your notes and materials are encrypted. We don't share your data with anyone. You can delete your account anytime."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "Go to Settings > Subscription > Cancel. You keep access until your billing period ends."
    },
    {
      question: "Does Lucero work in my language?",
      answer: "Lucero supports English, Spanish, French, German, Italian, Portuguese, and Chinese. More languages coming soon."
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
          <ParticleBurst />
          <div className="hero-content animate-on-scroll">
            <h1 className="hero-title">
              Get better grades in <br />
              <span className="highlight-text">less time</span>
            </h1>
            <p className="hero-subtitle">
              Upload your study materials. Get organized notes, quizzes, and flashcards. 
              Track what you know and what needs work.
            </p>
            <Link to="/auth" className="cta-button">Try Lucero now</Link>

            <div className="hero-illustration">
              <img src="/lucero-new-logo.png" alt="Lucero Horse Mascot" className="horse-mascot" />
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
              <div className="feature-icon"><HiOutlineDocumentText /></div>
              <h3>Smart Notes</h3>
              <p>Auto-generated notes from your materials</p>
            </div>
            <div className="feature-item animate-on-scroll delay-200">
              <div className="feature-icon"><HiOutlineQuestionMarkCircle /></div>
              <h3>Quizzes</h3>
              <p>Test yourself on your material</p>
            </div>
            <div className="feature-item animate-on-scroll delay-300">
              <div className="feature-icon"><HiOutlineSquare3Stack3D /></div>
              <h3>Flashcards</h3>
              <p>Review key concepts</p>
            </div>
            <div className="feature-item animate-on-scroll delay-100">
              <div className="feature-icon"><HiOutlineChartBar /></div>
              <h3>Progress Tracker</h3>
              <p>See your performance over time</p>
            </div>
            <div className="feature-item animate-on-scroll delay-200">
              <div className="feature-icon"><HiOutlineChatBubbleLeftRight /></div>
              <h3>AI Chat</h3>
              <p>Ask questions about your material</p>
            </div>
            <div className="feature-item animate-on-scroll delay-300">
              <div className="feature-icon"><HiOutlineUserGroup /></div>
              <h3>Study Groups</h3>
              <p>Share notes with classmates</p>
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
            <p>Study smarter, not harder</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card animate-on-scroll delay-100">
              <div className="benefit-icon"><HiOutlineBolt /></div>
              <h3>Save Time</h3>
              <p>Stop rewriting notes. Lucero does it for you.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-200">
              <div className="benefit-icon"><HiOutlineLightBulb /></div>
              <h3>Remember More</h3>
              <p>Spaced repetition and active recall built in.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-300">
              <div className="benefit-icon"><HiOutlineArrowTrendingUp /></div>
              <h3>Track Progress</h3>
              <p>See what you know and what needs work.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-100">
              <div className="benefit-icon"><HiOutlineTrophy /></div>
              <h3>Ace Your Exams</h3>
              <p>Practice questions and instant feedback.</p>
            </div>
          </div>
        </section>

        {/* Golden Note Section */}
        <section className="golden-note-section">
          <div className="golden-note-content">
            <div className="golden-note-text animate-on-scroll">
              <h2>Meet the future of note-taking</h2>
              <p className="golden-note-description">
                Lucero refines your notes and connects topics into one structured summary
                — the <strong>Golden Note</strong>.
              </p>

              <div className="golden-note-features">
                <div className="gn-feature">
                  <div className="gn-icon"><HiOutlineClipboardDocumentList /></div>
                  <div>
                    <h4>Topics</h4>
                    <p>Lucero organizes your material by easy to understand topics.</p>
                  </div>
                </div>
                <div className="gn-feature">
                  <div className="gn-icon"><HiOutlinePencilSquare /></div>
                  <div>
                    <h4>Note refinement</h4>
                    <p>Improve your messy notes with just one click.</p>
                  </div>
                </div>
                <div className="gn-feature">
                  <div className="gn-icon"><HiOutlineSparkles /></div>
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
              <div className="step-image upload-image"><HiOutlineArrowUpTray /></div>
            </div>
            <div className="step-card animate-on-scroll delay-200">
              <h3>2. Study</h3>
              <div className="step-image study-image"><HiOutlineBookOpen /></div>
            </div>
            <div className="step-card animate-on-scroll delay-300">
              <h3>3. Improve</h3>
              <div className="step-image improve-image"><HiOutlineChartBarSquare /></div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="pricing-section">
          <div className="section-header">
            <h2>Select a plan to get started</h2>
            <div className="pricing-toggle">
              <span
                className={`toggle-option ${isAnnual ? 'active' : ''}`}
                onClick={() => setIsAnnual(true)}
              >
                Annual 50% off
              </span>
              <span
                className={`toggle-option ${!isAnnual ? 'active' : ''}`}
                onClick={() => setIsAnnual(false)}
              >
                Monthly
              </span>
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
                <span className="amount">{isAnnual ? '4.99' : '9.99'}</span>
                <span className="period">/month</span>
              </div>
              <p className="billing-info">
                {isAnnual ? '$59.99 billed annually' : '$9.99 billed monthly'}
              </p>
              <Link to="/auth" className="pricing-button solid">Get started</Link>
              <ul className="features-list">
                <li><span className="check-icon">✔</span> Unlimited notes</li>
                <li><span className="check-icon">✔</span> Unlimited exercises</li>
                <li><span className="check-icon">✔</span> Unlimited uploads</li>
                <li><span className="check-icon">✔</span> Unlimited AI chat</li>
              </ul>
              <div className="card-illustration">
                <img src="/lucero-new-logo.png" alt="Lucero Horse" className="horse-mascot-small" />
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
          <p>Free plan available. No credit card required.</p>
          <Link to="/auth" className="cta-button-large">Get Started</Link>
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
                <img src="/lucero-new-logo.png" alt="Horse" className="horse-friend" />
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="footer-cta">
          <div className="cta-content">
            <h2>Meet the future <br />of note-taking</h2>
            <p>Your notes, organized and refined into one structured summary.</p>
            <Link to="/auth" className="cta-button-white">Get Started</Link>
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

