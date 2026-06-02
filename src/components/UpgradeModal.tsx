import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { redirectToCheckout, redirectToCustomerPortal, PLANS } from '../services/stripe'
import './UpgradeModal.css'

interface UpgradeModalProps {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { user } = useAuth()
  const [isAnnual, setIsAnnual] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async () => {
    if (!user?.email) return
    setLoading(true)
    setError('')
    try {
      const plan = isAnnual ? PLANS.pro_annual : PLANS.pro_monthly
      await redirectToCheckout(plan.priceId, user.id, user.email)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!user?.id) return
    setLoading(true)
    setError('')
    try {
      await redirectToCustomerPortal(user.id)
    } catch (err: any) {
      setError(err.message || 'Could not open billing portal.')
      setLoading(false)
    }
  }

  return (
    <div className="upgrade-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
        <button className="upgrade-close" onClick={onClose}>✕</button>

        <div className="upgrade-header">
          <h2>Upgrade to <span>Pro</span></h2>
          <p>Unlock unlimited access to every feature in LUCERO</p>
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

        <div className="upgrade-price">
          <span className="upgrade-amount">
            ${isAnnual ? PLANS.pro_annual.monthlyEquivalent : PLANS.pro_monthly.price}
          </span>
          <span className="upgrade-period">/month</span>
        </div>
        <p className="upgrade-billing">
          {isAnnual
            ? `$${PLANS.pro_annual.price} billed annually`
            : `$${PLANS.pro_monthly.price} billed monthly`}
        </p>

        <ul className="upgrade-features">
          <li>Unlimited PDF uploads & AI analysis</li>
          <li>Unlimited AI chat messages</li>
          <li>Advanced quizzes, flashcards & mind maps</li>
          <li>Live Study Mode with face detection</li>
          <li>Group Study & Video Rooms</li>
          <li>Unlimited Courses & Topics</li>
          <li>All premium themes</li>
          <li>Priority support</li>
        </ul>

        {error && <p className="upgrade-error">{error}</p>}

        <button
          className="upgrade-btn"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? 'Redirecting to payment…' : `Upgrade to Pro — $${isAnnual ? PLANS.pro_annual.monthlyEquivalent : PLANS.pro_monthly.price}/mo`}
        </button>

        <button
          className="manage-billing-btn"
          onClick={handleManageBilling}
          disabled={loading}
        >
          Manage billing / cancel
        </button>

        <p className="upgrade-footer">
          Secured by Stripe · Cancel anytime · No hidden fees
        </p>
      </div>
    </div>
  )
}
