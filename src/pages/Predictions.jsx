import { useState, useEffect } from 'react'
import { getMatches, getPrediction, savePrediction, getWildcardsRemaining } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/MatchCard'
import PredictionForm from '../components/PredictionForm'
import Countdown from '../components/Countdown'
import { Lock, Check, AlertCircle } from 'lucide-react'

const Predictions = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [wildcardsRemaining, setWildcardsRemaining] = useState(3)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    setLoading(true)
    const allMatches = await getMatches()
    const now = new Date()

    const active = allMatches
      .filter(m => m.status !== 'finished')
      .map(m => ({
        ...m,
        status: m.status === 'upcoming' && new Date(m.datetime) <= now ? 'locked' : m.status
      }))

    setMatches(active)

    // Cargar predicciones
    const predsMap = {}
    await Promise.all(
      active.map(async match => {
        const pred = await getPrediction(user.id, match.id)
        if (pred) predsMap[match.id] = pred
      })
    )
    setPredictions(predsMap)

    // Cargar comodines restantes
    const remaining = await getWildcardsRemaining(user.id)
    setWildcardsRemaining(remaining)

    setLoading(false)
  }

  const handleSave = async (matchId, homeScore, awayScore, isWildcard = false, resolutionData = null) => {
  setSaving(matchId)
  const result = await savePrediction(user.id, matchId, homeScore, awayScore, isWildcard, resolutionData)
  setSaving(null)
  if (result.error) {
    showToast(result.error, 'error')
  } else {
    setPredictions(prev => ({
      ...prev,
      [matchId]: { 
        userId: user.id, matchId, homeScore, awayScore, isWildcard,
        predictsDraw: homeScore === awayScore,
        predictedResolution: resolutionData?.predictedResolution || null,
        penaltyWinner: resolutionData?.penaltyWinner || null,
        penaltyHome: resolutionData?.penaltyHome ?? null,
        penaltyAway: resolutionData?.penaltyAway ?? null
      }
    }))
    const remaining = await getWildcardsRemaining(user.id)
    setWildcardsRemaining(remaining)
    showToast(
      isWildcard 
        ? '🃏 ¡Predicción con COMODÍN guardada! x2' 
        : resolutionData?.predictedResolution === 'penalties'
          ? '⚽ ¡Predicción con penales guardada!'
          : resolutionData?.predictedResolution === 'extra_time'
            ? '⏱️ ¡Predicción con suplementario guardada!'
            : '¡Predicción guardada! ⚽', 
      'success'
    )
  }
}

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const upcomingMatches = matches.filter(m => m.status === 'upcoming')
  const lockedMatches = matches.filter(m => m.status === 'locked' || m.status === 'live')

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

  const todayUpcoming = upcomingMatches.filter(m => {
    const d = new Date(m.datetime)
    return d >= today && d < tomorrow
  })
  const futureUpcoming = upcomingMatches.filter(m => {
    const d = new Date(m.datetime)
    return d >= tomorrow
  })

  const noPredCount = upcomingMatches.filter(m => !predictions[m.id]).length

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="loading-spinner" /></div>

  return (
    <div className="animate-fade-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>🔮 Predicciones</h1>
        <p>
          {noPredCount > 0
            ? `⚠️ ${noPredCount} partido${noPredCount > 1 ? 's' : ''} sin predicción`
            : '✅ ¡Todos predichos!'}
        </p>
      </div>

      {/* 🃏 Indicador de comodines restantes */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '8px', marginBottom: '16px',
        padding: '10px 16px',
        background: wildcardsRemaining > 0 
          ? 'rgba(212,168,67,0.08)' 
          : 'rgba(239,68,68,0.08)',
        border: `1px solid ${wildcardsRemaining > 0 
          ? 'rgba(212,168,67,0.2)' 
          : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 'var(--radius-lg)'
      }}>
        <span style={{ fontSize: '20px' }}>🃏</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          Comodines x2:
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              fontSize: '16px',
              opacity: i < wildcardsRemaining ? 1 : 0.2,
              filter: i < wildcardsRemaining ? 'none' : 'grayscale(1)'
            }}>
              🃏
            </span>
          ))}
        </div>
        <span style={{
          fontSize: '11px', fontWeight: '700',
          color: wildcardsRemaining > 0 ? 'var(--secondary)' : 'var(--danger)'
        }}>
          {wildcardsRemaining > 0 
            ? `${wildcardsRemaining} disponible${wildcardsRemaining !== 1 ? 's' : ''}` 
            : '¡Agotados!'}
        </span>
      </div>

      {/* Partidos de HOY */}
      {todayUpcoming.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'
          }}>
            <div style={{
              background: 'var(--danger)', borderRadius: '50%',
              width: '8px', height: '8px', animation: 'pulse 1.5s infinite'
            }} />
            <h3 className="section-title" style={{ margin: 0, color: 'var(--danger)' }}>
              🔥 HOY — ¡Predice ya!
            </h3>
          </div>
          {todayUpcoming.map(match => {
            const existing = predictions[match.id]
            return (
              <MatchCard key={match.id} match={match}>
                <Countdown targetDate={match.datetime} />
                {existing && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    justifyContent: 'center', marginTop: '8px',
                    color: 'var(--success)', fontSize: '12px'
                  }}>
                    <Check size={14} />
                    <span>
                      Ya predijiste: {existing.homeScore} - {existing.awayScore}
                      {existing.isWildcard && ' 🃏x2'}
                    </span>
                  </div>
                )}
                <PredictionForm
                  match={match}
                  initialHome={existing?.homeScore ?? 0}
                  initialAway={existing?.awayScore ?? 0}
                  initialWildcard={existing?.isWildcard ?? false}
                  initialPenaltyData={existing?.predictedResolution ? {
                    predictedResolution: existing.predictedResolution,
                    penaltyWinner: existing.penaltyWinner,
                    penaltyHome: existing.penaltyHome,
                    penaltyAway: existing.penaltyAway
                  } : null}
                  wildcardsRemaining={wildcardsRemaining}
                  onSave={(h, a, w, p) => handleSave(match.id, h, a, w, p)}
                  disabled={saving === match.id}
                />
              </MatchCard>
            )
          })}
        </>
      )}

      {/* Próximos partidos */}
      {futureUpcoming.length > 0 && (
        <>
          <h3 className="section-title mt-2">
            <AlertCircle size={18} color="var(--info)" /> Próximos ({futureUpcoming.length})
          </h3>
          {futureUpcoming.map(match => {
            const existing = predictions[match.id]
            return (
              <MatchCard key={match.id} match={match}>
                <Countdown targetDate={match.datetime} />
                {existing && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    justifyContent: 'center', marginTop: '8px',
                    color: 'var(--success)', fontSize: '12px'
                  }}>
                    <Check size={14} />
                    <span>
                      Ya predijiste: {existing.homeScore} - {existing.awayScore}
                      {existing.isWildcard && ' 🃏x2'}
                    </span>
                  </div>
                )}
                <PredictionForm
                  match={match}
                  initialHome={existing?.homeScore ?? 0}
                  initialAway={existing?.awayScore ?? 0}
                  initialWildcard={existing?.isWildcard ?? false}
                  initialPenaltyData={existing?.penaltyWinner ? {
                    penaltyWinner: existing.penaltyWinner,
                    penaltyHome: existing.penaltyHome,
                    penaltyAway: existing.penaltyAway
                  } : null}
                  wildcardsRemaining={wildcardsRemaining}
                  onSave={(h, a, w, p) => handleSave(match.id, h, a, w, p)}
                  disabled={saving === match.id}
                />
              </MatchCard>
            )
          })}
        </>
      )}

      {/* Bloqueados */}
      {lockedMatches.length > 0 && (
        <>
          <h3 className="section-title mt-2">
            <Lock size={18} color="var(--warning)" /> Bloqueados ({lockedMatches.length})
          </h3>
          {lockedMatches.map(match => {
            const existing = predictions[match.id]
            return (
              <MatchCard key={match.id} match={match}>
                {existing ? (
                  <div style={{
                    marginTop: '12px', padding: '10px', background: 'var(--bg-dark)',
                    borderRadius: 'var(--radius-sm)', textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Tu predicción: 
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>
                      {existing.homeScore} - {existing.awayScore}
                    </span>
                    {existing.isWildcard && (
                      <div style={{
                        marginTop: '4px', fontSize: '11px',
                        fontWeight: '700', color: 'var(--secondary)'
                      }}>
                        🃏 Comodín x2 activado
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    marginTop: '12px', padding: '10px',
                    background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)',
                    textAlign: 'center', color: 'var(--danger)', fontSize: '13px'
                  }}>
                    ⚠️ No predijiste este partido
                  </div>
                )}
              </MatchCard>
            )
          })}
        </>
      )}

      {upcomingMatches.length === 0 && lockedMatches.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p className="empty-state-text">No hay partidos pendientes</p>
        </div>
      )}
    </div>
  )
}

export default Predictions
