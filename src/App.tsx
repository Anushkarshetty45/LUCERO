import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { TimerProvider } from './contexts/TimerContext'
import { LiveStudyProvider } from './contexts/LiveStudyContext'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Home from './pages/Home'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import FloatingLiveStudy from './components/LiveStudy/FloatingLiveStudy'
import LiveStudySession from './components/LiveStudy/LiveStudySession'
import FloatingTimer from './components/FloatingTimer'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <BrowserRouter>
      <TimerProvider>
        <LiveStudyProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/auth"
              element={user ? <Navigate to="/dashboard" /> : <Auth />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/course/:courseId"
              element={user ? <Course /> : <Navigate to="/auth" />}
            />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
          {/* Global Widgets */}
          {user && <FloatingTimer />}
          {user && <FloatingLiveStudy />}
          {user && <LiveStudySession />}
        </LiveStudyProvider>
      </TimerProvider>
    </BrowserRouter>
  )
}

export default App
