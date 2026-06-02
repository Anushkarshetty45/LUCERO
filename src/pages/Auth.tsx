import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const [isLogin, setIsLogin] = useState(mode !== 'register')

  useEffect(() => {
    if (mode === 'login') setIsLogin(true)
    else if (mode === 'register') setIsLogin(false)
  }, [mode])

  return (
    <AuthLayout>
      {isLogin ? (
        <LoginForm onToggle={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onToggle={() => setIsLogin(true)} selectedPlan="free" />
      )}
    </AuthLayout>
  )
}
