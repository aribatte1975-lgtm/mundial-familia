import { useState } from 'react'
import { Minus, Plus, Check } from 'lucide-react'

const PredictionForm = ({ 
  match, 
  initialHome = 0, 
  initialAway = 0, 
  initialWildcard = false,
  wildcardsRemaining = 3,
  onSave, 
  disabled = false 
}) => {
  const [homeScore, setHomeScore] = useState(initialHome)
  const [awayScore, setAwayScore] = useState(initialAway)
  const [wildcard, setWildcard] = useState(initialWildcard)
  const [saved, setSaved] = useState(false)

  const increment = (setter, value) => {
    if (!disabled) setter(Math.min(value + 1, 20))
  }

  const decrement = (setter, value) => {
    if (!disabled) setter(Math.max(value - 1, 0))
  }

  const handleSave = () => {
    if (disabled) return
    onSave(homeScore, awayScore, wildcard)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleWildcard = () => {
    if (disabled) return
    // Si ya está activado, puede desactivar
    if (wildcard) {
      setWildcard(false)
      return
    }
    // Si no tiene comodines, no puede activar
    // (descontar 1 si ya tenía este partido con comodín previo)
    const available = initialWildcard ? wildcardsRemaining + 1 : wildcardsRemaining
    if (available <= 0) return
    setWildcard(true)
  }

  // Calcular comodines disponibles para mostrar
  const displayRemaining = wildcard && !initialWildcard 
    ? wildcardsRemaining - 1 
    : !wildcard && initialWildcard 
      ? wildcardsRemaining + 1 
      : wildcardsRemaining

  return (
    <div style={{ marginTop: '12px' }}>
      <div className="prediction-score-input" style={{ justifyContent: 'center' }}>
        <div className="score-input-group">
          <button className="score-btn" onClick={() => increment(setHomeScore, homeScore)} disabled={disabled}>
            <Plus size={16} />
          </button>
          <div className="score-display">{homeScore}</div>
          <button className="score-btn" onClick={() => decrement(setHomeScore, homeScore)} disabled={disabled}>
            <Minus size={16} />
          </button>
        </div>

        <span className="score-separator">-</span>

        <div className="score-input-group">
          <button className="score-btn" onClick={() => increment(setAwayScore, awayScore)} disabled={disabled}>
            <Plus size={16} />
          </button>
          <div className="score-display">{awayScore}</div>
          <button className="score-btn" onClick={() => decrement(setAwayScore, awayScore)} disabled={disabled}>
            <Minus size={16} />
          </button>
        </div>
      </div>

      {/* 🃏 BOTÓN COMODÍN */}
      {!disabled && (
        <button
          onClick={toggleWildcard}
          disabled={!wildcard && wildcardsRemaining <= 0 && !initialWildcard}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '10px 16px',
            borderRadius: 'var(--radius)',
            border: wildcard 
              ? '2px solid var(--secondary)' 
              : '2px dashed var(--border)',
            background: wildcard 
              ? 'rgba(212,168,67,0.15)' 
              : 'transparent',
            color: wildcard 
              ? 'var(--secondary)' 
              : (!wildcard && wildcardsRemaining <= 0 && !initialWildcard)
                ? 'var(--text-muted)'
                : 'var(--text-secondary)',
            cursor: (!wildcard && wildcardsRemaining <= 0 && !initialWildcard) 
              ? 'not-allowed' 
              : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '700',
            transition: 'all 0.3s ease',
            opacity: (!wildcard && wildcardsRemaining <= 0 && !initialWildcard) ? 0.4 : 1,
            animation: wildcard ? 'pulse 2s infinite' : 'none'
          }}
        >
          <span style={{ fontSize: '18px' }}>🃏</span>
          {wildcard ? (
            <>
              ¡COMODÍN x2 ACTIVADO! 
              <span style={{ fontSize: '11px', opacity: 0.7 }}>(tocar para quitar)</span>
            </>
          ) : wildcardsRemaining <= 0 && !initialWildcard ? (
            'Sin comodines disponibles'
          ) : (
            <>
              Usar comodín x2
              <span style={{
                background: 'var(--bg-dark)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}>
                {displayRemaining} restante{displayRemaining !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </button>
      )}

      {/* Indicador si ya está bloqueado con comodín */}
      {disabled && initialWildcard && (
        <div style={{
          marginTop: '8px', padding: '8px 12px',
          background: 'rgba(212,168,67,0.1)',
          border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          fontSize: '12px', fontWeight: '700',
          color: 'var(--secondary)'
        }}>
          🃏 Comodín x2 usado en este partido
        </div>
      )}

      <button 
        className={`btn ${saved ? 'btn-success' : wildcard ? '' : 'btn-primary'} ${disabled ? 'btn-disabled' : ''}`}
        onClick={handleSave}
        disabled={disabled}
        style={{ 
          marginTop: '12px',
          ...(wildcard && !saved ? {
            background: 'linear-gradient(135deg, var(--secondary), var(--secondary-dark))',
            color: 'var(--bg-dark)',
            boxShadow: '0 4px 15px rgba(212,168,67,0.4)',
            fontWeight: '800'
          } : {})
        }}
      >
        {saved ? (
          <><Check size={18} /> {wildcard ? '¡Guardado con Comodín! 🃏' : '¡Guardado!'}</>
        ) : disabled ? (
          'Partido bloqueado'
        ) : wildcard ? (
          '🃏⚽ Guardar con COMODÍN x2'
        ) : (
          '⚽ Guardar Predicción'
        )}
      </button>
    </div>
  )
}

export default PredictionForm