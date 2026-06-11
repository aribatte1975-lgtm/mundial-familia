import { useState, useEffect } from 'react'
import { getMatches, getPredictionsByMatch, getUsers, calculatePoints, getSettings } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/MatchCard'

const Matches = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('all')
  const [expandedMatch, setExpandedMatch] = useState(null)
  const [matchPredictions, setMatchPredictions] = useState({})
  const [users, setUsers] = useState([])
  const [settings, setSettings] = useState({ pointsExact: 5, pointsCorrect: 3 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [m, u, s] = await Promise.all([getMatches(), getUsers(), getSettings()])
    setMatches(m)
    setUsers(u)
    setSettings(s)
    setLoading(false)
  }

  const handleExpand = async (matchId) => {
    if (expandedMatch === matchId) { setExpandedMatch(null); return }
    setExpandedMatch(matchId)
    if (!matchPredictions[matchId]) {
      const preds = await getPredictionsByMatch(matchId)
      setMatchPredictions(prev => ({ ...prev, [matchId]: preds }))
    }
  }

  const filteredMatches = matches.filter(m => {
    if (filter === 'upcoming') return m.status === 'upcoming'
    if (filter === 'finished') return m.status === 'finished'
    return true
  })

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="loading-spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>⚽ Partidos</h1>
        <p>{matches.length} partidos del Mundial 2026</p>
      </div>

      <div className="tabs">
        {[['all','Todos'],['upcoming','Próximos'],['finished','Finalizados']].map(([key, label]) => (
          <button key={key} className={`tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="empty-state-text">No hay partidos aquí</p>
        </div>
      ) : (
        filteredMatches.map(match => (
          <div key={match.id}>
            <MatchCard match={match} />

            {match.status === 'finished' && (
              <p style={{
                textAlign: 'center', fontSize: '12px', color: 'var(--primary-light)',
                marginTop: '-6px', marginBottom: '10px', cursor: 'pointer'
              }} onClick={() => handleExpand(match.id)}>
                {expandedMatch === match.id ? '▲ Ocultar predicciones' : '▼ Ver predicciones de todos'}
              </p>
            )}

            {expandedMatch === match.id && match.status === 'finished' && (
              <div className="card animate-slide-up" style={{ marginTop: '-6px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Predicciones familiares:
                </h4>
                {users.map(u => {
                  const preds = matchPredictions[match.id] || []
                  const pred = preds.find(p => p.userId === u.id)
                  const points = pred ? calculatePoints(pred, match, settings) : null
                  return (
                    <div key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 0', borderBottom: '1px solid var(--border)'
                    }}>
                      <span>{u.emoji}</span>
                      <span style={{ flex: 1, fontSize: '14px' }}>{u.name}</span>
                      {pred ? (
                        <>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>
                            {pred.homeScore} - {pred.awayScore}
                          </span>
                          <span className={`points-earned ${points?.type || ''}`}>
                            {points?.type === 'exact' ? `⭐+${points.points}` :
                             points?.type === 'correct' ? `✅+${points.points}` : '❌'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No predijo</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default Matches