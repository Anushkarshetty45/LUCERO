import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const plan = searchParams.get('plan')
  const [isLogin, setIsLogin] = useState(mode !== 'register')

  useEffect(() => {
    if (mode === 'login') setIsLogin(true)
    else if (mode === 'register') setIsLogin(false)
  }, [mode])

  // Store pro intent so Dashboard can open payment modal after login
  useEffect(() => {
    if (plan === 'pro') {
      localStorage.setItem('lucero-pending-plan', 'pro')
    }
  }, [plan])

  return (
    <AuthLayout>
      {isLogin ? (
        <LoginForm onToggle={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onToggle={() => setIsLogin(true)} selectedPlan={plan === 'pro' ? 'pro' : 'free'} />
      )}
    </AuthLayout>
  )
}
