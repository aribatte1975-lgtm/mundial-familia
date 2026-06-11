import { useState, useEffect, useCallback } from 'react'
import { getMatches, getPrediction, savePrediction, getSettings } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/MatchCard'
import PredictionForm from '../components/PredictionForm'
import { Lock, Check, AlertCircle } from 'lucide-react'

const Predictions = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
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

    // Filtrar partidos no terminados
    const active = allMatches.filter(m => m.status !== 'finished')

    // Actualizar estado localmente si ya pasó la hora
    const withStatus = active.map(m => ({
      ...m,
      status: m.status === 'upcoming' && new Date(m.datetime) <= now ? 'locked' : m.status
    }))

    setMatches(withStatus)

    // Cargar predicciones del usuario
    const predsMap = {}
    await Promise.all(
      withStatus.map(async match => {
        const pred = await getPrediction(user.id, match.id)
        if (pred) predsMap[match.id] = pred
      })
    )
    setPredictions(predsMap)
    setLoading(false)
  }

  const handleSave = async (matchId, homeScore, awayScore) => {
    setSaving(matchId)
    const result = await savePrediction(user.id, matchId, homeScore, awayScore)
    setSaving(null)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      setPredictions(prev => ({ ...prev, [matchId]: { userId: user.id, matchId, homeScore, awayScore } }))
      showToast('¡Predicción guardada! ⚽', 'success')
    }
  }

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const upcomingMatches = matches.filter(m => m.status === 'upcoming')
  const lockedMatches = matches.filter(m => m.status === 'locked' || m.status === 'live')

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="loading-spinner" /></div>

  return (
    <div className="animate-fade-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>🔮 Predicciones</h1>
        <p>Coloca tu resultado antes del partido</p>
      </div>

      {upcomingMatches.length > 0 && (
        <>
          <h3 className="section-title">
            <AlertCircle size={18} color="var(--info)" /> Abiertos ({upcomingMatches.length})
          </h3>
          {upcomingMatches.map(match => {
            const existing = predictions[match.id]
            return (
              <MatchCard key={match.id} match={match}>
                {existing && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    justifyContent: 'center', marginTop: '8px',
                    color: 'var(--success)', fontSize: '12px'
                  }}>
                    <Check size={14} />
                    <span>Ya predijiste: {existing.homeScore} - {existing.awayScore}</span>
                  </div>
                )}
                <PredictionForm
                  match={match}
                  initialHome={existing?.homeScore ?? 0}
                  initialAway={existing?.awayScore ?? 0}
                  onSave={(h, a) => handleSave(match.id, h, a)}
                  disabled={saving === match.id}
                />
              </MatchCard>
            )
          })}
        </>
      )}

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
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tu predicción: </span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>
                      {existing.homeScore} - {existing.awayScore}
                    </span>
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