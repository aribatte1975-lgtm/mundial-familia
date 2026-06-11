import { useState, useEffect } from 'react'

const SplashScreen = ({ onFinish }) => {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Fase 0: Logo aparece
    setTimeout(() => setPhase(1), 400)
    // Fase 1: Título aparece
    setTimeout(() => setPhase(2), 1000)
    // Fase 2: Subtítulo aparece
    setTimeout(() => setPhase(3), 1600)
    // Fase 3: Todo desaparece
    setTimeout(() => setPhase(4), 2800)
    // Fase 4: Termina
    setTimeout(() => onFinish(), 3300)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #0A0E1A 0%, #1a0a10 50%, #0A0E1A 100%)',
      opacity: phase >= 4 ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      {/* Fondo animado - partículas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              borderRadius: '50%',
              background: i % 3 === 0 ? '#D4A843' : i % 3 === 1 ? '#8B1538' : '#ffffff30',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.6
            }}
          />
        ))}
      </div>

      {/* Anillo brillante detrás del trofeo */}
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%)',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 0.8s ease-out',
      }} />

      {/* Trofeo */}
      <div style={{
        fontSize: '80px',
        opacity: phase >= 0 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(0.3) translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        filter: phase >= 1 ? 'drop-shadow(0 0 30px rgba(212,168,67,0.5))' : 'none',
        zIndex: 1
      }}>
        🏆
      </div>

      {/* Título */}
      <h1 style={{
        fontSize: '28px',
        fontWeight: '900',
        background: 'linear-gradient(135deg, #D4A843, #FFD700, #D4A843)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginTop: '16px',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out 0.2s',
        textAlign: 'center',
        zIndex: 1,
        letterSpacing: '-0.5px'
      }}>
        Mundial en Familia
      </h1>

      {/* Año */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '8px',
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(15px)',
        transition: 'all 0.5s ease-out',
        zIndex: 1
      }}>
        <div style={{
          height: '1px',
          width: '40px',
          background: 'linear-gradient(90deg, transparent, #D4A843)'
        }} />
        <span style={{
          fontSize: '18px',
          fontWeight: '800',
          color: '#D4A843',
          letterSpacing: '4px'
        }}>
          2026
        </span>
        <div style={{
          height: '1px',
          width: '40px',
          background: 'linear-gradient(90deg, #D4A843, transparent)'
        }} />
      </div>

      {/* Sedes */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)',
        transition: 'all 0.5s ease-out 0.1s',
        zIndex: 1
      }}>
        <span style={{ fontSize: '24px' }}>🇺🇸</span>
        <span style={{ fontSize: '24px' }}>🇲🇽</span>
        <span style={{ fontSize: '24px' }}>🇨🇦</span>
      </div>

      {/* Subtítulo */}
      <p style={{
        fontSize: '13px',
        color: '#9CA3AF',
        marginTop: '12px',
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.5s ease-out 0.2s',
        zIndex: 1
      }}>
        ¿Quién será el mejor pronosticador?
      </p>

      {/* Balón giratorio */}
      <div style={{
        marginTop: '32px',
        fontSize: '20px',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 0.3s ease',
        animation: 'spin 1s linear infinite',
        zIndex: 1
      }}>
        ⚽
      </div>

      {/* Barra de carga */}
      <div style={{
        width: '120px',
        height: '3px',
        background: 'var(--border)',
        borderRadius: '3px',
        marginTop: '12px',
        overflow: 'hidden',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 0.3s ease',
        zIndex: 1
      }}>
        <div style={{
          height: '100%',
          borderRadius: '3px',
          background: 'linear-gradient(90deg, #8B1538, #D4A843)',
          animation: 'loadBar 1.2s ease-in-out',
          width: '100%'
        }} />
      </div>
    </div>
  )
}

export default SplashScreen