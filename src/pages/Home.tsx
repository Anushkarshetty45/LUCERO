import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import './Home.css'
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
import { IoTimer as HiOutlineTimer } from 'react-icons/io5'

// Particle Field Background
function ParticleField({ count = 1500 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 10
      const y = (Math.random() - 0.5) * 10
      const z = (Math.random() - 0.5) * 10
      positions.set([x, y, z], i * 3)
    }
    return positions
  }, [count])

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.getElapsedTime() * 0.02
      points.current.rotation.y = state.clock.getElapsedTime() * 0.03
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  )
}

// Animated Sphere with Wireframe
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.08
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
    }
  })

  return (
    <Sphere ref={meshRef} args={[1.5, 48, 48]} scale={1.5}>
      <MeshDistortMaterial
        color="#cccccc"
        attach="material"
        distort={0.3}
        speed={1}
        roughness={0.4}
        metalness={0.8}
        wireframe={true}
      />
    </Sphere>
  )
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isAnnual, setIsAnnual] = useState(true)

  // Intersection Observer for scroll animations - Optimized for faster loading
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          // Stop observing once animated to improve performance
          observer.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0,
      rootMargin: '50px' // Trigger animations 50px before element enters viewport
    })

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
      answer: "The free plan includes 5 courses, 5 PDF uploads, and 30 AI chat messages per month. The Pro plan offers unlimited courses, uploads, AI chat, and access to advanced features like Live Study, Group Study, and PDF Analyzer for just $4.99/month (or $59.99/year with 50% savings)."
    },
    {
      question: "How is Lucero AI different from other AI models?",
      answer: "Lucero is built for students. It analyzes your PDFs, creates topics and courses, generates quizzes, and provides an AI chatbot for instant help with your studies."
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
            <Link to="/auth" className="nav-button">Log In</Link>
          </div>
        </div>
      </nav>

      <main className="home-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-3d">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 75 }}
              dpr={[1, 1.5]}
              performance={{ min: 0.5 }}
            >
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <ParticleField />
              <AnimatedSphere />
            </Canvas>
          </div>
          <div className="hero-content animate-on-scroll">
            <h1 className="hero-title">
              Get better grades in <br />
              <span className="highlight-text">less time</span>
            </h1>
            <p className="hero-subtitle">
              Upload your study materials. Get organized notes, quizzes, and flashcards. 
              Track what you know and what needs work.
            </p>
            <Link to="/auth?mode=register" className="cta-button">Try Lucero now</Link>

            <div className="hero-illustration">
              <img src="/lucero-new-logo.png" alt="Lucero Horse Mascot" className="horse-mascot" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <h2>Everything you need <br />to <span className="highlight-circle">succeed</span></h2>
            <p>All the tools to study smarter, stay focused, and ace your exams</p>
          </div>

          <div className="features-grid">
            <div className="feature-item animate-on-scroll delay-100">
              <div className="feature-icon"><HiOutlineArrowUpTray /></div>
              <h3>PDF Analyzer</h3>
              <p>Upload PDFs and get instant analysis, mind maps & study plans</p>
            </div>
            <div className="feature-item animate-on-scroll delay-200">
              <div className="feature-icon"><HiOutlineSquare3Stack3D /></div>
              <h3>Topics & Courses</h3>
              <p>Create and organize your study materials into topics and courses</p>
            </div>
            <div className="feature-item animate-on-scroll delay-300">
              <div className="feature-icon"><HiOutlineQuestionMarkCircle /></div>
              <h3>Quizzes & Flashcards</h3>
              <p>Practice questions and spaced repetition to remember more</p>
            </div>
            <div className="feature-item animate-on-scroll delay-100">
              <div className="feature-icon"><HiOutlineChatBubbleLeftRight /></div>
              <h3>AI Chatbot</h3>
              <p>Ask questions and get instant AI-powered explanations</p>
            </div>
            <div className="feature-item animate-on-scroll delay-200">
              <div className="feature-icon"><HiOutlineBolt /></div>
              <h3>Live Study Mode</h3>
              <p>Face detection & focus tracking with real-time analytics</p>
            </div>
            <div className="feature-item animate-on-scroll delay-300">
              <div className="feature-icon"><HiOutlineUserGroup /></div>
              <h3>Group Study</h3>
              <p>Collaborate with peers in video rooms and study together</p>
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
              <div className="benefit-icon"><HiOutlineArrowUpTray /></div>
              <h3>Analyze PDFs Instantly</h3>
              <p>Upload any PDF and get mind maps, summaries, and study plans.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-200">
              <div className="benefit-icon"><HiOutlineUserGroup /></div>
              <h3>Study Together</h3>
              <p>Join group study rooms with video chat and collaborate in real-time.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-300">
              <div className="benefit-icon"><HiOutlineBolt /></div>
              <h3>Stay Focused</h3>
              <p>Live study mode tracks your attention with face detection.</p>
            </div>
            <div className="benefit-card animate-on-scroll delay-100">
              <div className="benefit-icon"><HiOutlineChatBubbleLeftRight /></div>
              <h3>AI-Powered Help</h3>
              <p>Get instant answers to your questions with our AI chatbot.</p>
            </div>
          </div>
        </section>

        {/* Actual Features Section */}
        <section className="golden-note-section">
          <div className="golden-note-content">
            <div className="golden-note-text animate-on-scroll">
              <h2>Powerful features to study smarter</h2>
              <p className="golden-note-description">
                Everything you need to organize your materials, collaborate with peers,
                and stay focused on your goals.
              </p>

              <div className="golden-note-features">
                <div className="gn-feature">
                  <div className="gn-icon"><HiOutlineUserGroup /></div>
                  <div>
                    <h4>Group Study</h4>
                    <p>Create or join study groups with video rooms and real-time collaboration.</p>
                  </div>
                </div>
                <div className="gn-feature">
                  <div className="gn-icon"><HiOutlineSquare3Stack3D /></div>
                  <div>
                    <h4>Topics & Courses</h4>
                    <p>Create custom topics and courses to organize all your study materials in one place.</p>
                  </div>
                </div>
                <div className="gn-feature">
                  <div className="gn-icon"><HiOutlineTimer /></div>
                  <div>
                    <h4>Live Study Mode</h4>
                    <p>Track your focus with face detection, monitor study time, and get real-time analytics on your productivity.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="golden-note-visual animate-on-scroll delay-200">
              <div className="gn-card gn-card-topics">
                <div className="gn-card-header">PDF Analyzer</div>
                <div className="gn-card-body">Extract insights from PDFs instantly</div>
              </div>
              <div className="gn-card gn-card-refinement">
                <div className="gn-card-header">AI Chatbot</div>
                <div className="gn-card-body">Get instant answers to your questions</div>
              </div>
              <div className="gn-card gn-card-golden">
                <div className="gn-card-header">Group Study Rooms</div>
                <div className="gn-card-body">Collaborate with your study group live</div>
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
                  <td>PDF Analyzer</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                </tr>
                <tr>
                  <td>Group Study Rooms</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
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
                  <td>Course & Topic Organization</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="check">✔</span></td>
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
                  <td>Live Study Mode</td>
                  <td className="highlight-col"><span className="check">✔</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
                  <td><span className="cross">✕</span></td>
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
            <Link to="/auth?mode=register" className="cta-button-black">Try it for yourself</Link>
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
              <Link to="/auth?mode=register&plan=free" className="pricing-button outline">Get started</Link>
              <ul className="features-list">
                <li><span className="check-icon">✔</span> 5 PDF uploads per month</li>
                <li><span className="check-icon">✔</span> 30 AI chat messages per month</li>
                <li><span className="check-icon">✔</span> Basic quizzes & flashcards</li>
                <li><span className="check-icon">✔</span> Progress tracking & study timer</li>
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
              <Link to="/auth?mode=register&plan=pro" className="pricing-button solid">Get started</Link>
              <ul className="features-list">
                <li><span className="check-icon">✔</span> Everything in Starter, plus:</li>
                <li><span className="check-icon">✔</span> Unlimited uploads & AI chat</li>
                <li><span className="check-icon">✔</span> Advanced PDF Analyzer with mind maps</li>
                <li><span className="check-icon">✔</span> Live Study Mode with face detection</li>
                <li><span className="check-icon">✔</span> Group Study & Video Rooms</li>
                <li><span className="check-icon">✔</span> Unlimited Topics & Courses</li>
                <li><span className="check-icon">✔</span> 15+ premium themes</li>
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
          <Link to="/auth?mode=register" className="cta-button-large">Get Started</Link>
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
            <h2>Study smarter, <br />not harder</h2>
            <p>Everything you need to organize materials, collaborate with peers, and ace your exams.</p>
            <Link to="/auth?mode=register" className="cta-button-white">Get Started</Link>
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

