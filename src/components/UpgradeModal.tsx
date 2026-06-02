import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { openRazorpayCheckout, openCustomerPortal, PLANS } from '../services/razorpay'
import './UpgradeModal.css'

interface UpgradeModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function UpgradeModal({ onClose, onSuccess }: UpgradeModalProps) {
  const { user } = useAuth()
  const [isAnnual, setIsAnnual] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = () => {
    if (!user?.email) return
    setLoading(true)
    setError('')

    const plan = isAnnual ? PLANS.pro_annual : PLANS.pro_monthly

    openRazorpayCheckout({
      planId: plan.planId,
      userId: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'Student',
      email: user.email,
      onSuccess: (_paymentId, _subscriptionId) => {
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
    if (!user?.id) return
    setLoading(true)
    setError('')
    try {
      await openCustomerPortal(user.id)
    } catch (err: any) {
      setError(err.message || 'Could not open billing portal.')
    }
    setLoading(false)
  }

  const plan = isAnnual ? PLANS.pro_annual : PLANS.pro_monthly

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
            {isAnnual ? PLANS.pro_annual.monthlyEquivalent : PLANS.pro_monthly.priceDisplay}
          </span>
          <span className="upgrade-period">/month</span>
        </div>
        <p className="upgrade-billing">
          {isAnnual
            ? `${PLANS.pro_annual.priceDisplay} billed annually`
            : `${PLANS.pro_monthly.priceDisplay} billed monthly`}
        </p>

        <ul className="upgrade-features">
          <li>Unlimited PDF uploads & AI analysis</li>
          <li>Unlimited AI chat messages</li>
          <li>Advanced quizzes, flashcards & mind maps</li>
          <li>Live Study Mode with face detection</li>
          <li>Group Study & Video Rooms with screen share</li>
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
          {loading ? 'Opening payment…' : `Pay ${plan.priceDisplay}${isAnnual ? '/year' : '/month'}`}
        </button>

        <button
          className="manage-billing-btn"
          onClick={handleManageBilling}
          disabled={loading}
        >
          Manage billing / cancel
        </button>

        <p className="upgrade-footer">
          Secured by Razorpay · UPI, Cards, NetBanking accepted · Cancel anytime
        </p>
      </div>
    </div>
  )
}
