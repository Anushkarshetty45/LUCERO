// Razorpay payment integration
// The Razorpay checkout.js script is loaded via <script> in public/index.html
import { supabase } from './supabase'

declare global {
  interface Window {
    Razorpay: any
  }
}

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3002'

export const PLANS = {
  pro_monthly: {
    name: 'Pro Monthly',
    priceINR: 749,
    priceDisplay: '₹749',
    interval: 'month' as const,
    planId: process.env.REACT_APP_RAZORPAY_PRO_MONTHLY_PLAN_ID || '',
  },
  pro_annual: {
    name: 'Pro Annual',
    priceINR: 5988,
    priceDisplay: '₹5,988',
    monthlyEquivalent: '₹499',
    interval: 'year' as const,
    planId: process.env.REACT_APP_RAZORPAY_PRO_ANNUAL_PLAN_ID || '',
  },
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return `Bearer ${session.access_token}`
}

interface CheckoutOptions {
  planId: string
  name: string
  email: string
  onSuccess: (paymentId: string, subscriptionId: string) => void
  onError: (error: string) => void
}

export async function openRazorpayCheckout({ planId, name, email, onSuccess, onError }: CheckoutOptions) {
  try {
    const authorization = await getAuthHeader()

    // Create subscription — userId/email come from the verified JWT on the server
    const res = await fetch(`${SERVER_URL}/api/razorpay/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization },
      body: JSON.stringify({ planId }),
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
        try {
          const verifyAuthorization = await getAuthHeader()
          const verifyRes = await fetch(`${SERVER_URL}/api/razorpay/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', authorization: verifyAuthorization },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })
          if (!verifyRes.ok) {
            const err = await verifyRes.json()
            throw new Error(err.error || 'Payment verification failed')
          }
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

export async function cancelSubscription(): Promise<string> {
  const authorization = await getAuthHeader()
  const res = await fetch(`${SERVER_URL}/api/razorpay/cancel-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization },
    body: JSON.stringify({}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription')
  return data.message
}

export async function openCustomerPortal() {
  const authorization = await getAuthHeader()
  const res = await fetch(`${SERVER_URL}/api/razorpay/portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to open billing portal')
  }
  const { url } = await res.json()
  window.open(url, '_blank')
}
