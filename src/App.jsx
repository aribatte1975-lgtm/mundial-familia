import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import Login from './pages/Login'
import Home from './pages/Home'
import Matches from './pages/Matches'
import Predictions from './pages/Predictions'
import Ranking from './pages/Ranking'
import Admin from './pages/Admin'
import Special from './pages/Special'
import Groups from './pages/Groups'   // ← NUEVO

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [splashReady, setSplashReady] = useState(false)

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('splash_shown')
    if (hasSeenSplash) setShowSplash(false)
    setSplashReady(true)
  }, [])

  const handleSplashFinish = () => {
    setShowSplash(false)
    sessionStorage.setItem('splash_shown', 'true')
  }

  if (!splashReady) return null

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute><Layout /></ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="matches" element={<Matches />} />
              <Route path="predictions" element={<Predictions />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="special" element={<Special />} />
              <Route path="grupos" element={<Groups />} />  {/* ← NUEVO */}
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  )
}

export default App