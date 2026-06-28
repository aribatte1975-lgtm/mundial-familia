import { useState, useEffect } from 'react'
import { Minus, Plus, Check } from 'lucide-react'

const KNOCKOUT_STAGES = ['Dieciseisavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final']

const PredictionForm = ({ 
  match, 
  initialHome = 0, 
  initialAway = 0, 
  initialWildcard = false,
  initialPenaltyData = null,
  wildcardsRemaining = 3,
  onSave, 
  disabled = false 
}) => {
  const [homeScore, setHomeScore] = useState(initialHome)
  const [awayScore, setAwayScore] = useState(initialAway)
  const [wildcard, setWildcard] = useState(initialWildcard)
  const [saved, setSaved] = useState(false)

  // Penales
  const [penaltyWinner, setPenaltyWinner] = useState(initialPenaltyData?.penaltyWinner || null)
  const [penaltyHome, setPenaltyHome] = useState(initialPenaltyData?.penaltyHome ?? 0)
  const [penaltyAway, setPenaltyAway] = useState(initialPenaltyData?.penaltyAway ?? 0)

  const isKnockout = KNOCKOUT_STAGES.includes(match?.stage)
  const isDraw = homeScore === awayScore
  const showPenalties = isKnockout && isDraw && match?.stage !== 'Tercer Puesto'

  // Resetear penales si ya no es empate
  useEffect(() => {
    if (!isDraw) {
      setPenaltyWinner(null)
      setPenaltyHome(0)
      setPenaltyAway(0)
    }
  }, [isDraw])

  const increment = (setter, value) => {
    if (!disabled) setter(Math.min(value + 1, 20))
  }

  const decrement = (setter, value) => {
    if (!disabled) setter(Math.max(value - 1, 0))
  }

  const handleSave = () => {
    if (disabled) return

    const penaltyData = showPenalties ? {
      penaltyWinner,
      penaltyHome,
      penaltyAway
    } : null

    onSave(homeScore, awayScore, wildcard, penaltyData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleWildcard = () => {
    if (disabled) return
    if (wildcard) {
      setWildcard(false)
      return
    }
    const available = initialWildcard ? wildcardsRemaining + 1 : wildcardsRemaining
    if (available <= 0) return
    setWildcard(true)
  }

  const displayRemaining = wildcard && !initialWildcard 
    ? wildcardsRemaining - 1 
    : !wildcard && initialWildcard 
      ? wildcardsRemaining + 1 
      : wildcardsRemaining

  // Validar que penales estén completos si es empate en eliminatoria
  const penaltiesValid = !showPenalties || (
    penaltyWinner && 
    penaltyHome !== penaltyAway // penales no pueden empatar
  )

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Resultado 90 minutos */}
      {isKnockout && (
        <div style={{
          textAlign: 'center', fontSize: '10px',
          color: 'var(--text-muted)', marginBottom: '6px',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          Resultado en 90 minutos
        </div>
      )}

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

      {/* 🎯 SECCIÓN PENALES — solo aparece si es eliminatoria y predice empate */}
      {showPenalties && !disabled && (
        <div className="animate-slide-up" style={{
          marginTop: '12px',
          padding: '14px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(212,168,67,0.08))',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{
            textAlign: 'center', fontSize: '12px',
            fontWeight: '700', color: 'var(--warning)',
            marginBottom: '10px'
          }}>
            ⚽ ¡Predijiste empate! ¿Quién clasifica en penales?
          </div>

          {/* Selector de quién clasifica */}
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '12px'
          }}>
            <button
              onClick={() => setPenaltyWinner(match.homeTeam)}
              style={{
                flex: 1, padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: penaltyWinner === match.homeTeam
                  ? '2px solid var(--success)' : '1px solid var(--border)',
                background: penaltyWinner === match.homeTeam
                  ? 'rgba(16,185,129,0.1)' : 'var(--bg-dark)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '24px' }}>{match.homeFlag}</div>
              <div style={{
                fontSize: '11px', fontWeight: '600', marginTop: '4px',
                color: penaltyWinner === match.homeTeam
                  ? 'var(--success)' : 'var(--text-secondary)'
              }}>
                {match.homeTeam}
              </div>
              {penaltyWinner === match.homeTeam && (
                <div style={{ fontSize: '10px', color: 'var(--success)', marginTop: '2px' }}>
                  ✅ Clasifica
                </div>
              )}
            </button>

            <button
              onClick={() => setPenaltyWinner(match.awayTeam)}
              style={{
                flex: 1, padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: penaltyWinner === match.awayTeam
                  ? '2px solid var(--success)' : '1px solid var(--border)',
                background: penaltyWinner === match.awayTeam
                  ? 'rgba(16,185,129,0.1)' : 'var(--bg-dark)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '24px' }}>{match.awayFlag}</div>
              <div style={{
                fontSize: '11px', fontWeight: '600', marginTop: '4px',
                color: penaltyWinner === match.awayTeam
                  ? 'var(--success)' : 'var(--text-secondary)'
              }}>
                {match.awayTeam}
              </div>
              {penaltyWinner === match.awayTeam && (
                <div style={{ fontSize: '10px', color: 'var(--success)', marginTop: '2px' }}>
                  ✅ Clasifica
                </div>
              )}
            </button>
          </div>

          {/* Resultado de penales */}
          {penaltyWinner && (
            <div className="animate-fade-in">
              <div style={{
                textAlign: 'center', fontSize: '11px',
                color: 'var(--text-muted)', marginBottom: '8px'
              }}>
                Resultado en penales (opcional, +5pts si acertás)
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '12px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '14px' }}>{match.homeFlag}</span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    marginTop: '4px'
                  }}>
                    <button
                      className="score-btn"
                      style={{ width: '28px', height: '28px' }}
                      onClick={() => setPenaltyHome(Math.max(0, penaltyHome - 1))}
                    >
                      <Minus size={12} />
                    </button>
                    <div style={{
                      width: '36px', height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px', fontWeight: '800',
                      color: 'var(--warning)'
                    }}>
                      {penaltyHome}
                    </div>
                    <button
                      className="score-btn"
                      style={{ width: '28px', height: '28px' }}
                      onClick={() => setPenaltyHome(Math.min(20, penaltyHome + 1))}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <span style={{
                  fontSize: '14px', fontWeight: '800',
                  color: 'var(--text-muted)'
                }}>-</span>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '14px' }}>{match.awayFlag}</span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    marginTop: '4px'
                  }}>
                    <button
                      className="score-btn"
                      style={{ width: '28px', height: '28px' }}
                      onClick={() => setPenaltyAway(Math.max(0, penaltyAway - 1))}
                    >
                      <Minus size={12} />
                    </button>
                    <div style={{
                      width: '36px', height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px', fontWeight: '800',
                      color: 'var(--warning)'
                    }}>
                      {penaltyAway}
                    </div>
                    <button
                      className="score-btn"
                      style={{ width: '28px', height: '28px' }}
                      onClick={() => setPenaltyAway(Math.min(20, penaltyAway + 1))}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advertencia si penales empatan */}
              {penaltyHome === penaltyAway && penaltyHome > 0 && (
                <div style={{
                  marginTop: '8px', textAlign: 'center',
                  fontSize: '11px', color: 'var(--danger)'
                }}>
                  ⚠️ Los penales no pueden empatar
                </div>
              )}

              {/* Advertencia si ganador no coincide */}
              {penaltyHome !== penaltyAway && (
                (penaltyHome > penaltyAway && penaltyWinner !== match.homeTeam) ||
                (penaltyAway > penaltyHome && penaltyWinner !== match.awayTeam)
              ) && (
                <div style={{
                  marginTop: '8px', textAlign: 'center',
                  fontSize: '11px', color: 'var(--danger)'
                }}>
                  ⚠️ El resultado de penales no coincide con quién elegiste que clasifica
                </div>
              )}
            </div>
          )}

          {/* Info de puntos */}
          <div style={{
            marginTop: '10px', padding: '8px',
            background: 'var(--bg-dark)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '10px', color: 'var(--text-muted)',
            textAlign: 'center', lineHeight: '1.5'
          }}>
            🎯 Acertar empate: <b style={{ color: 'var(--success)' }}>+{3}</b> ·
            Acertar clasificado: <b style={{ color: 'var(--success)' }}>+{3}</b> ·
            Penales exactos: <b style={{ color: 'var(--secondary)' }}>+{5}</b>
          </div>
        </div>
      )}

      {/* Indicador si predijo penales (bloqueado) */}
      {disabled && initialPenaltyData?.penaltyWinner && (
        <div style={{
          marginTop: '8px', padding: '10px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center', fontSize: '12px'
        }}>
          <span style={{ color: 'var(--warning)' }}>⚽ Penales:</span>{' '}
          <span style={{ fontWeight: '700' }}>
            Clasifica {initialPenaltyData.penaltyWinner}
          </span>
          {initialPenaltyData.penaltyHome !== null && (
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({initialPenaltyData.penaltyHome}-{initialPenaltyData.penaltyAway})
            </span>
          )}
        </div>
      )}

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
        disabled={disabled || (showPenalties && !penaltiesValid)}
        style={{ 
          marginTop: '12px',
          ...(wildcard && !saved ? {
            background: 'linear-gradient(135deg, var(--secondary), var(--secondary-dark))',
            color: 'var(--bg-dark)',
            boxShadow: '0 4px 15px rgba(212,168,67,0.4)',
            fontWeight: '800'
          } : {}),
          opacity: (showPenalties && !penaltiesValid) ? 0.5 : 1
        }}
      >
        {saved ? (
          <><Check size={18} /> {wildcard ? '¡Guardado con Comodín! 🃏' : '¡Guardado!'}</>
        ) : disabled ? (
          'Partido bloqueado'
        ) : showPenalties && !penaltiesValid ? (
          '⚠️ Completa la predicción de penales'
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