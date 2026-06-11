import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Calendar, Edit3, Trophy, Settings, LogOut, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { getPendingPredictionsCount } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Cargar pendientes
  useEffect(() => { loadPending() }, [])

  // Actualizar en tiempo real cuando cambian matches o predictions
  useRealtime('matches', () => loadPending())
  useRealtime('predictions', () => loadPending())

  const loadPending = async () => {
    if (user) {
      const count = await getPendingPredictionsCount(user.id)
      setPendingCount(count)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    setShowConfirm(false)
  }

  return (
    <>
      {/* Modal de confirmación */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            padding: '28px 24px', textAlign: 'center', maxWidth: '300px',
            width: '100%', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{user?.emoji}</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              ¿Salir, {user?.name}?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Podrás volver a entrar con tu PIN
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowConfirm(false)} style={{
                flex: 1, padding: '12px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--bg-card-hover)',
                color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer',
                fontSize: '14px'
              }}>
                Cancelar
              </button>
              <button onClick={handleLogout} style={{
                flex: 1, padding: '12px', borderRadius: 'var(--radius)',
                border: 'none', background: 'var(--danger)',
                color: 'white', fontWeight: '600', cursor: 'pointer',
                fontSize: '14px'
              }}>
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <NavLink to="/" end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home />
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/matches"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar />
          <span>Partidos</span>
        </NavLink>

        {/* Predecir con Badge */}
        <NavLink to="/predictions"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={{ position: 'relative' }}>
          <Edit3 />
          <span>Predecir</span>
          {pendingCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '6px',
              background: 'var(--danger)',
              color: 'white',
              fontSize: '9px',
              fontWeight: '800',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 8px rgba(239,68,68,0.5)'
            }}>
              {pendingCount > 99 ? '99+' : pendingCount}
            </div>
          )}
        </NavLink>

        <NavLink to="/special"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Star />
          <span>Especial</span>
        </NavLink>

        <NavLink to="/ranking"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Trophy />
          <span>Ranking</span>
        </NavLink>

        {user?.isAdmin && (
          <NavLink to="/admin"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings />
            <span>Admin</span>
          </NavLink>
        )}

        <button className="nav-item" onClick={() => setShowConfirm(true)}>
          <LogOut />
          <span>Salir</span>
        </button>
      </nav>
    </>
  )
}

export default Navbar