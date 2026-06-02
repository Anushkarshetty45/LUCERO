// Razorpay payment integration
// The Razorpay checkout.js script is loaded via <script> in public/index.html

declare global {
  interface Window {
    Razorpay: any
  }
}

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3002'

export const PLANS = {
  pro_monthly: {
    name: 'Pro Monthly',
    priceINR: 749,        // ₹749/month (~$8.99)
    priceDisplay: '₹749',
    interval: 'month' as const,
    planId: process.env.REACT_APP_RAZORPAY_PRO_MONTHLY_PLAN_ID || '',
  },
  pro_annual: {
    name: 'Pro Annual',
    priceINR: 5988,       // ₹5,988/year (~₹499/month, saves 33%)
    priceDisplay: '₹5,988',
    monthlyEquivalent: '₹499',
    interval: 'year' as const,
    planId: process.env.REACT_APP_RAZORPAY_PRO_ANNUAL_PLAN_ID || '',
  },
}

interface CheckoutOptions {
  planId: string
  userId: string
  name: string
  email: string
  onSuccess: (paymentId: string, subscriptionId: string) => void
  onError: (error: string) => void
}

export async function openRazorpayCheckout({ planId, userId, name, email, onSuccess, onError }: CheckoutOptions) {
  try {
    // Create subscription on the server
    const res = await fetch(`${SERVER_URL}/api/razorpay/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, userId, email }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to create subscription')
    }

    const { subscriptionId, keyId } = await res.json()

    const options = {
      key: keyId,
      subscription_id: subscriptionId,
      name: 'LUCERO',
      description: 'Pro Plan Subscription',
      image: '/logo192.png',
      prefill: { name, email },
      theme: { color: '#7c3aed' },
      handler: async (response: any) => {
        // Verify payment on server
        try {
          const verifyRes = await fetch(`${SERVER_URL}/api/razorpay/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              userId,
            }),
          })
          if (!verifyRes.ok) throw new Error('Payment verification failed')
          onSuccess(response.razorpay_payment_id, response.razorpay_subscription_id)
        } catch (err: any) {
          onError(err.message)
        }
      },
      modal: {
        ondismiss: () => onError('Payment cancelled'),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (err: any) {
    onError(err.message || 'Failed to open payment window')
  }
}

export async function openCustomerPortal(userId: string) {
  const res = await fetch(`${SERVER_URL}/api/razorpay/portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to open billing portal')
  }
  const { url } = await res.json()
  window.open(url, '_blank')
}
