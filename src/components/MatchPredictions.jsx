import { useState, useEffect } from 'react'
import { getPredictionsByMatch, getUsers, calculatePoints, getSettings } from '../lib/supabase'

const MatchPredictions = ({ match }) => {
  const [predictions, setPredictions] = useState([])
  const [users, setUsers] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  const matchStarted = new Date(match.datetime) <= new Date()
  const isFinished = match.status === 'finished'

  useEffect(() => {
    loadPredictions()
  }, [match.id])

  const loadPredictions = async () => {
    setLoading(true)
    const [preds, u, s] = await Promise.all([
      getPredictionsByMatch(match.id),
      getUsers(),
      getSettings()
    ])
    setPredictions(preds)
    setUsers(u)
    setSettings(s)
    setLoading(false)

    // Auto-revelar si el partido ya empezó
    if (matchStarted) setRevealed(true)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '8px' }}>
        <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div style={{
        padding: '10px', textAlign: 'center',
        fontSize: '12px', color: 'var(--text-muted)'
      }}>
        Nadie ha predicho este partido aún
      </div>
    )
  }

  // Antes de que empiece → ocultas
  if (!matchStarted && !revealed) {
    return (
      <div style={{
        padding: '12px',
        background: 'var(--bg-dark)',
        borderRadius: 'var(--radius-sm)',
        marginTop: '10px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>
              🔒 {predictions.length} predicción{predictions.length > 1 ? 'es' : ''} oculta{predictions.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Se revelan cuando empiece el partido
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {users.map(u => {
              const hasPred = predictions.find(p => p.userId === u.id)
              return (
                <div key={u.id} style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: hasPred ? 'var(--bg-card-hover)' : 'transparent',
                  border: hasPred ? '2px solid var(--success)' : '2px dashed var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                  opacity: hasPred ? 1 : 0.3
                }}>
                  {hasPred ? u.emoji : '?'}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Reveladas → mostrar todas
  return (
    <div style={{
      marginTop: '10px',
      background: 'var(--bg-dark)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '8px 12px',
        fontSize: '11px',
        fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>👀</span>
        <span>Predicciones de la familia</span>
      </div>

      {users.map((u, idx) => {
        const pred = predictions.find(p => p.userId === u.id)
        const points = pred && isFinished ? calculatePoints(pred, match, settings) : null

        return (
          <div key={u.id} style={{
            padding: '8px 12px',
            borderBottom: idx < users.length - 1 ? '1px solid var(--border)' : 'none',
            animation: `slideUp 0.3s ease-out ${idx * 0.1}s both`
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>{u.emoji}</span>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>
                {u.name}
              </span>

              {pred ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    background: 'var(--bg-card)', borderRadius: '8px',
                    padding: '4px 12px', fontWeight: '800', fontSize: '15px',
                    color: points?.type === 'exact' ? 'var(--secondary)' :
                          points?.type === 'correct' ? 'var(--success)' :
                          points?.type === 'wrong' ? 'var(--text-muted)' : 'var(--text-primary)',
                    border: points?.type === 'exact' ? '1px solid var(--secondary)' :
                            points?.type === 'correct' ? '1px solid var(--success)' :
                            '1px solid var(--border)'
                  }}>
                    {pred.homeScore} - {pred.awayScore}
                  </div>

                  {points && (
                    <span style={{
                      fontSize: '12px', fontWeight: '700',
                      color: points.type === 'exact' ? 'var(--secondary)' :
                            points.type === 'correct' ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {points.type !== 'wrong' ? `+${points.points}` : '❌'}
                      {pred.isWildcard && points.points > 0 && ' 🃏'}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No predijo 😅
                </span>
              )}
            </div>

            {/* Detalle de resolución predicha */}
            {pred && pred.predictedResolution && (
              <div style={{
                marginTop: '4px', paddingLeft: '28px',
                fontSize: '10px', color: 'var(--text-muted)',
                display: 'flex', gap: '8px', flexWrap: 'wrap'
              }}>
                <span>
                  {pred.predictedResolution === 'extra_time' ? '⏱️ Prórroga' : '⚽ Penales'}
                  {' → '}
                  <b style={{ color: 'var(--text-secondary)' }}>{pred.penaltyWinner}</b>
                </span>
                {pred.predictedResolution === 'penalties' &&
                pred.penaltyHome !== null && pred.penaltyAway !== null && (
                  <span>
                    ({pred.penaltyHome}-{pred.penaltyAway})
                  </span>
                )}
              </div>
            )}

            {/* Desglose de puntos en eliminatorias */}
            {points && points.breakdown && points.breakdown.length > 0 && isFinished && (
              <div style={{
                marginTop: '6px', paddingLeft: '28px',
                display: 'flex', flexDirection: 'column', gap: '2px'
              }}>
                {points.breakdown.map((b, i) => (
                  <div key={i} style={{
                    fontSize: '10px', color: 'var(--text-muted)',
                    display: 'flex', justifyContent: 'space-between'
                  }}>
                    <span>{b.label}</span>
                    <span style={{
                      fontWeight: '700',
                      color: b.points > 0 ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {b.points > 0 ? `+${b.points}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MatchPredictions