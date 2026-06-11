import { useState, useEffect } from 'react'
import { getMatches } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/MatchCard'
import MatchPredictions from '../components/MatchPredictions'

const Matches = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('all')
  const [expandedMatch, setExpandedMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const m = await getMatches()
    setMatches(m)
    setLoading(false)
  }

  const filteredMatches = matches.filter(m => {
    if (filter === 'upcoming') return m.status === 'upcoming'
    if (filter === 'finished') return m.status === 'finished'
    if (filter === 'today') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 86400000)
      const d = new Date(m.datetime)
      return d >= today && d < tomorrow
    }
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
        {[
          ['today', '📅 Hoy'],
          ['all', 'Todos'],
          ['upcoming', 'Próximos'],
          ['finished', 'Finalizados']
        ].map(([key, label]) => (
          <button key={key}
            className={`tab ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {filter === 'today' ? '😴' : '📭'}
          </div>
          <p className="empty-state-text">
            {filter === 'today' ? 'No hay partidos hoy' : 'No hay partidos aquí'}
          </p>
        </div>
      ) : (
        filteredMatches.map(match => {
          const matchStarted = new Date(match.datetime) <= new Date()
          const canShowPredictions = matchStarted || match.status === 'finished'

          return (
            <div key={match.id}>
              <MatchCard match={match} />

              {/* Botón ver predicciones */}
              <p style={{
                textAlign: 'center', fontSize: '12px',
                color: canShowPredictions ? 'var(--primary-light)' : 'var(--text-muted)',
                marginTop: '-6px', marginBottom: '10px', cursor: 'pointer'
              }} onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}>
                {expandedMatch === match.id
                  ? '▲ Ocultar predicciones'
                  : canShowPredictions
                    ? '👀 Ver predicciones de todos'
                    : '🔒 Predicciones ocultas hasta el inicio'
                }
              </p>

              {/* Predicciones expandidas */}
              {expandedMatch === match.id && (
                <div className="animate-slide-up" style={{ marginBottom: '16px' }}>
                  <MatchPredictions match={match} />
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default Matches