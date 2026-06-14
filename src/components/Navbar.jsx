import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Calendar, Edit3, Trophy, Settings, LogOut, Star, BarChart2, MoreHorizontal, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { getPendingPredictionsCount } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const moreRef = useRef(null)

  useEffect(() => { loadPending() }, [])

  // Cerrar menú "Más" al cambiar de página
  useEffect(() => { setShowMore(false) }, [location.pathname])

  // Cerrar menú "Más" al tocar fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMore(false)
      }
    }
    if (showMore) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMore])

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

  // Rutas que van en el menú "Más"
  const moreRoutes = [
    { to: '/grupos', icon: '📊', label: 'Grupos' },
    { to: '/special', icon: '⭐', label: 'Especial' },
    ...(user?.isAdmin ? [{ to: '/admin', icon: '⚙️', label: 'Admin' }] : []),
  ]

  // ¿Estoy en alguna ruta del menú "Más"?
  const isMoreActive = moreRoutes.some(r => location.pathname === r.to)

  return (
    <>
      {/* ===== MODAL CERRAR SESIÓN ===== */}
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

      {/* ===== MENÚ MÁS (popup) ===== */}
      {showMore && (
        <>
          {/* Overlay semitransparente */}
          <div
            onClick={() => setShowMore(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 998
            }}
          />

          {/* Panel popup */}
          <div
            ref={moreRef}
            style={{
              position: 'fixed',
              bottom: '70px',
              right: '50%',
              transform: 'translateX(50%)',
              width: 'calc(100% - 32px)',
              maxWidth: '320px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 999,
              overflow: 'hidden',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            {/* Header del popup */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '12px', fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                Más opciones
              </span>
              <button
                onClick={() => setShowMore(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Links del popup */}
            {moreRoutes.map(route => (
              <NavLink
                key={route.to}
                to={route.to}
                onClick={() => setShowMore(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  textDecoration: 'none',
                  background: isActive
                    ? 'rgba(212,168,67,0.08)' : 'transparent',
                  color: isActive
                    ? 'var(--secondary)' : 'var(--text-primary)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '15px',
                  transition: 'background 0.2s'
                })}
              >
                <span style={{ fontSize: '20px' }}>{route.icon}</span>
                <span>{route.label}</span>
                {route.to === location.pathname && (
                  <span style={{
                    marginLeft: 'auto', width: '6px', height: '6px',
                    borderRadius: '50%', background: 'var(--secondary)'
                  }} />
                )}
              </NavLink>
            ))}

            {/* Cerrar sesión dentro del popup */}
            <button
              onClick={() => { setShowMore(false); setShowConfirm(true) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', width: '100%',
                background: 'transparent',
                border: 'none', cursor: 'pointer',
                color: 'var(--danger)',
                fontWeight: '500', fontSize: '15px',
                transition: 'background 0.2s'
              }}
            >
              <LogOut size={20} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </>
      )}

      {/* ===== NAVBAR PRINCIPAL (5 items fijos) ===== */}
      <nav className="navbar">

        {/* Inicio */}
        <NavLink to="/" end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home />
          <span>Inicio</span>
        </NavLink>

        {/* Partidos */}
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
              top: '2px', right: '6px',
              background: 'var(--danger)', color: 'white',
              fontSize: '9px', fontWeight: '800',
              minWidth: '16px', height: '16px',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 8px rgba(239,68,68,0.5)'
            }}>
              {pendingCount > 99 ? '99+' : pendingCount}
            </div>
          )}
        </NavLink>

        {/* Ranking */}
        <NavLink to="/ranking"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Trophy />
          <span>Ranking</span>
        </NavLink>

        {/* Más */}
        <button
          className={`nav-item ${isMoreActive || showMore ? 'active' : ''}`}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? <X /> : <MoreHorizontal />}
          <span>Más</span>
          {/* Punto indicador si hay admin o estás en ruta del menú más */}
          {isMoreActive && !showMore && (
            <span style={{
              position: 'absolute',
              top: '2px', right: '8px',
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: 'var(--secondary)'
            }} />
          )}
        </button>

      </nav>
    </>
  )
}

export default Navbar