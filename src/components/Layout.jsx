import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMatches, getPredictionsByUser, getWildcardsRemaining } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import Navbar from './Navbar'

const Layout = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [urgentCount, setUrgentCount] = useState(0)
  const [soonMatches, setSoonMatches] = useState([])
  const [wildcardsLeft, setWildcardsLeft] = useState(3)
  const [dismissed, setDismissed] = useState(false)

  // Recargar cuando cambian partidos o predicciones
  useRealtime('matches', () => checkUrgent())
  useRealtime('predictions', () => checkUrgent())

  useEffect(() => { checkUrgent() }, [location.pathname])

  // Revisar cada 30 segundos
  useEffect(() => {
    checkUrgent()
    const interval = setInterval(checkUrgent, 30000)
    return () => clearInterval(interval)
  }, [])

  // Resetear dismissed cuando cambia la cantidad de urgentes
  useEffect(() => { setDismissed(false) }, [urgentCount])

  const checkUrgent = async () => {
    if (!user) return
    try {
      const [allMatches, myPreds, wildcards] = await Promise.all([
        getMatches(),
        getPredictionsByUser(user.id),
        getWildcardsRemaining(user.id)
      ])

      setWildcardsLeft(wildcards)

      const now = new Date()
      const predMatchIds = myPreds.map(p => p.matchId)

      // Partidos upcoming sin predicción
      const unpredicted = allMatches.filter(m =>
        m.status === 'upcoming' &&
        new Date(m.datetime) > now &&
        !predMatchIds.includes(m.id)
      )

      setUrgentCount(unpredicted.length)

      // Partidos que empiezan en menos de 3 horas sin predicción
      const threeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000)
      const soon = unpredicted
        .filter(m => new Date(m.datetime) <= threeHours)
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))

      setSoonMatches(soon)
    } catch (e) {
      console.error('Error checking urgent:', e)
    }
  }

  // No mostrar banner en la página de predicciones (ya tiene sus alertas)
  const showBanner = !dismissed &&
    location.pathname !== '/predictions' &&
    soonMatches.length > 0

  // Banner leve para partidos sin predecir (no urgentes)
  const showSoftBanner = !dismissed &&
    location.pathname !== '/predictions' &&
    soonMatches.length === 0 &&
    urgentCount > 0

  const getTimeLeft = (datetime) => {
    const diff = new Date(datetime) - new Date()
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins} min`
  }

  return (
    <div className="app-layout">

      {/* 🔴 BANNER URGENTE — partido en menos de 3 horas */}
      {showBanner && (
        <div
          onClick={() => navigate('/predictions')}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 997,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            padding: '10px 16px',
            cursor: 'pointer',
            animation: 'pulse 1.5s infinite',
            borderBottom: '2px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            maxWidth: '480px', margin: '0 auto'
          }}>
            <span style={{ fontSize: '22px', animation: 'bounceIn 0.6s ease-out' }}>
              🚨
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: '800', fontSize: '13px',
                color: 'white', lineHeight: '1.3'
              }}>
                ¡{soonMatches.length === 1
                  ? `${soonMatches[0].homeTeam} vs ${soonMatches[0].awayTeam} en ${getTimeLeft(soonMatches[0].datetime)}!`
                  : `${soonMatches.length} partidos empiezan pronto!`}
              </div>
              <div style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.8)',
                marginTop: '2px'
              }}>
                Toca para predecir antes de que se bloqueen
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              color: 'white'
            }}>
              IR →
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
            style={{
              position: 'absolute', top: '4px', right: '8px',
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '16px', cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 🟡 BANNER SUAVE — partidos pendientes pero no urgentes */}
      {showSoftBanner && (
        <div
          onClick={() => navigate('/predictions')}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 997,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(212,168,67,0.1))',
            borderBottom: '1px solid rgba(245,158,11,0.3)',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            maxWidth: '480px', margin: '0 auto'
          }}>
            <span style={{ fontSize: '16px' }}>⚽</span>
            <span style={{
              fontSize: '12px', fontWeight: '600',
              color: 'var(--warning)'
            }}>
              {urgentCount} partido{urgentCount !== 1 ? 's' : ''} sin predecir
            </span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              Predecir →
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
            style={{
              position: 'absolute', top: '4px', right: '8px',
              background: 'none', border: 'none',
              color: 'var(--text-muted)',
              fontSize: '14px', cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="app-content">
        <Outlet />
      </div>
      <Navbar />
    </div>
  )
}

export default Layout
