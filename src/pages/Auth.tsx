import { useState } from 'react'
import AuthLayout from '../components/auth/AuthLayout'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false)

  return (
    <AuthLayout>
      {isLogin ? (
        <LoginForm onToggle={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onToggle={() => setIsLogin(true)} />
      )}
    </AuthLayout>
  )
}