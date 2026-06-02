import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '')

export const PLANS = {
  pro_monthly: {
    name: 'Pro Monthly',
    price: 8.99,
    interval: 'month' as const,
    priceId: process.env.REACT_APP_STRIPE_PRO_MONTHLY_PRICE_ID || '',
  },
  pro_annual: {
    name: 'Pro Annual',
    price: 71.88,
    monthlyEquivalent: 5.99,
    interval: 'year' as const,
    priceId: process.env.REACT_APP_STRIPE_PRO_ANNUAL_PRICE_ID || '',
  },
}

export async function redirectToCheckout(priceId: string, userId: string, email: string) {
  const response = await fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:3002'}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, userId, email }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to create checkout session')
  }

  const { sessionId } = await response.json()
  const stripe = await stripePromise
  if (!stripe) throw new Error('Stripe failed to load')

  const { error } = await stripe.redirectToCheckout({ sessionId })
  if (error) throw new Error(error.message)
}

export async function redirectToCustomerPortal(userId: string) {
  const response = await fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:3002'}/api/stripe/create-portal-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Failed to open billing portal')
  }

  const { url } = await response.json()
  window.location.href = url
}
