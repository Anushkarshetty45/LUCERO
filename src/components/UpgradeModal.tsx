import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { openRazorpayCheckout, openCustomerPortal, cancelSubscription, PLANS } from '../services/razorpay'
import './UpgradeModal.css'

interface UpgradeModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function UpgradeModal({ onClose, onSuccess }: UpgradeModalProps) {
  const { user } = useAuth()
  const { limits, refreshProfile } = useSubscription()
  const [isAnnual, setIsAnnual] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState('')

  const handleUpgrade = () => {
    if (!user?.email) return

    const plan = isAnnual ? PLANS.pro_annual : PLANS.pro_monthly

    if (!plan.planId) {
      setError('Payment is not configured yet. Please contact support.')
      return
    }

    setLoading(true)
    setError('')

    openRazorpayCheckout({
      planId: plan.planId,
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'Student',
      email: user.email,
      onSuccess: async (_paymentId, _subscriptionId) => {
        // Server already upgraded the account via verify-payment — just refresh profile
        await refreshProfile()
        setLoading(false)
        onSuccess?.()
        onClose()
      },
      onError: (err) => {
        if (err !== 'Payment cancelled') setError(err)
        setLoading(false)
      },
    })
  }

  const handleManageBilling = async () => {
    setLoading(true)
    setError('')
    try {
      await openCustomerPortal()
    } catch (err: any) {
      setError(err.message || 'Could not open billing portal.')
    }
    setLoading(false)
  }

  const handleCancelSubscription = async () => {
    setLoading(true)
    setError('')
    try {
      const message = await cancelSubscription()
      await refreshProfile()
      setCancelSuccess(message)
      setShowCancelConfirm(false)
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription.')
      setShowCancelConfirm(false)
    }
    setLoading(false)
  }

  const plan = isAnnual ? PLANS.pro_annual : PLANS.pro_monthly

  const freeFeatures = [
    'Access to all core study tools',
    'Generate up to 5 AI Notes per day',
    'Upload up to 3 PDFs per day',
    'Create up to 3 Courses',
    'Generate up to 3 Flashcard sets per day',
    'Generate up to 3 Quizzes per day',
    'AI Study Assistant (10 chats/day)',
    'Group Study & Live Study — 1 free trial each',
    '2 themes included',
  ]

  const proFeatures = [
    'Unlimited Notes Generation',
    'Unlimited PDF Uploads & AI Chat',
    'Unlimited Quiz, Flashcard & Mind Map Generation',
    'Advanced PDF Analyzer with Mind Maps',
    'Live Study Mode with Face Detection',
    'Group Study & Video Rooms',
    'Unlimited Topics & Courses',
    'Premium Themes & Customization',
    'Priority Access to New Features',
  ]

  return (
    <div className="upgrade-overlay" onClick={onClose}>
      <div className="upgrade-modal-wide" onClick={e => e.stopPropagation()}>
        <button className="upgrade-close" onClick={onClose}>✕</button>

        <div className="upgrade-header">
          <h2>Choose Your Plan</h2>
          <p>Start free and upgrade when you're ready to go unlimited</p>
        </div>

        <div className="upgrade-toggle">
          <button
            className={`toggle-btn ${isAnnual ? 'active' : ''}`}
            onClick={() => setIsAnnual(true)}
          >
            Annual <span className="save-badge">Save 33%</span>
          </button>
          <button
            className={`toggle-btn ${!isAnnual ? 'active' : ''}`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </button>
        </div>

        <div className="plans-grid">
          {/* Free Plan */}
          <div className="plan-card free-card">
            <div className="plan-card-header">
              <span className="plan-badge free-badge">Free</span>
              <div className="plan-price">
                <span className="plan-amount">₹0</span>
                <span className="plan-period">/month</span>
              </div>
              <p className="plan-tagline">Perfect for students getting started</p>
            </div>

            <ul className="plan-features">
              {freeFeatures.map((f, i) => (
                <li key={i}>
                  <span className="feature-check free-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button className="plan-btn free-btn" onClick={onClose}>
              {limits.isPro ? 'Current: Free Features' : 'Start Free'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="plan-card pro-card">
            <div className="plan-popular-badge">Most Popular</div>
            <div className="plan-card-header">
              <span className="plan-badge pro-badge">Pro</span>
              <div className="plan-price">
                <span className="plan-amount">
                  {isAnnual ? PLANS.pro_annual.monthlyEquivalent : PLANS.pro_monthly.priceDisplay}
                </span>
                <span className="plan-period">/month</span>
              </div>
              {isAnnual && (
                <p className="plan-billed-note">{PLANS.pro_annual.priceDisplay} billed annually</p>
              )}
              <p className="plan-tagline">Built for serious learners</p>
            </div>

            <p className="pro-everything">Everything in Free, plus:</p>
            <ul className="plan-features">
              {proFeatures.map((f, i) => (
                <li key={i}>
                  <span className="feature-check pro-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {error && <p className="upgrade-error">{error}</p>}
            {cancelSuccess && <p className="upgrade-cancel-success">{cancelSuccess}</p>}

            {limits.isPro ? (
              <>
                <button
                  className="plan-btn pro-btn"
                  onClick={handleManageBilling}
                  disabled={loading}
                >
                  {loading ? 'Loading…' : 'Manage Billing'}
                </button>

                {!showCancelConfirm ? (
                  <button
                    className="plan-btn cancel-sub-btn"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={loading || !!cancelSuccess}
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <div className="cancel-confirm-box">
                    <p>Are you sure? You'll keep Pro access until the end of your current billing period.</p>
                    <div className="cancel-confirm-actions">
                      <button
                        className="plan-btn confirm-cancel-btn"
                        onClick={handleCancelSubscription}
                        disabled={loading}
                      >
                        {loading ? 'Cancelling…' : 'Yes, cancel'}
                      </button>
                      <button
                        className="plan-btn keep-sub-btn"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={loading}
                      >
                        Keep Pro
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                className="plan-btn pro-btn"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? 'Opening payment…' : `Upgrade to Pro — ${plan.priceDisplay}${isAnnual ? '/yr' : '/mo'}`}
              </button>
            )}

            <p className="upgrade-footer">
              Secured by Razorpay · UPI, Cards, NetBanking · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
