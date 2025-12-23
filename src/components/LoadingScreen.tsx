import './LoadingScreen.css'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <span className="logo-text">LUCERO</span>
        </div>
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-message">Loading your study space...</p>
      </div>
    </div>
  )
}
