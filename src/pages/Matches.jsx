import { useState, useEffect } from 'react'
import { getMatches } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/MatchCard'
import MatchPredictions from '../components/MatchPredictions'

const STAGES = [
  { key: 'all', label: 'Todas' },
  { key: 'Fase de Grupos', label: 'Grupos' },
  { key: 'Dieciseisavos', label: 'D16' },
  { key: 'Octavos de Final', label: 'Octavos' },
  { key: 'Cuartos de Final', label: 'Cuartos' },
  { key: 'Semifinal', label: 'Semis' },
  { key: 'Tercer Puesto', label: '3°' },
  { key: 'Final', label: 'Final' },
]

const Matches = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('today')
  const [stageFilter, setStageFilter] = useState('all')
  const [expandedMatch, setExpandedMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const m = await getMatches()
    setMatches(m)
    setLoading(false)
  }

  // Filtrar por estado
  const statusFiltered = matches.filter(m => {
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

  // Filtrar por etapa
  const filteredMatches = stageFilter === 'all'
    ? statusFiltered
    : statusFiltered.filter(m => m.stage === stageFilter)

  // Contar partidos por etapa (del filtro de estado actual)
  const getStageCount = (stageKey) => {
    if (stageKey === 'all') return statusFiltered.length
    return statusFiltered.filter(m => m.stage === stageKey).length
  }

  // Etapas que tienen partidos (para no mostrar etapas vacías)
  const availableStages = STAGES.filter(s =>
    s.key === 'all' || matches.some(m => m.stage === s.key)
  )

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="loading-spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>⚽ Partidos</h1>
        <p>{matches.length} partidos del Mundial 2026</p>
      </div>

      {/* Filtro por estado */}
      <div className="tabs">
        {[
          ['today', '📅 Hoy'],
          ['all', 'Todos'],
          ['upcoming', 'Próximos'],
          ['finished', 'Finalizados']
        ].map(([key, label]) => (
          <button key={key}
            className={`tab ${filter === key ? 'active' : ''}`}
            onClick={() => { setFilter(key); setStageFilter('all') }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtro por etapa */}
      <div style={{
        display: 'flex', gap: '6px', flexWrap: 'wrap',
        marginBottom: '16px', justifyContent: 'center'
      }}>
        {availableStages.map(s => {
          const count = getStageCount(s.key)
          return (
            <button
              key={s.key}
              onClick={() => setStageFilter(s.key)}
              style={{
                padding: '5px 10px',
                borderRadius: '20px',
                border: stageFilter === s.key
                  ? '2px solid var(--secondary)'
                  : '1px solid var(--border)',
                background: stageFilter === s.key
                  ? 'rgba(212,168,67,0.15)' : 'transparent',
                color: stageFilter === s.key
                  ? 'var(--secondary)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: stageFilter === s.key ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: count === 0 ? 0.4 : 1
              }}
            >
              {s.label}
              {count > 0 && (
                <span style={{
                  marginLeft: '4px',
                  fontSize: '10px',
                  opacity: 0.7
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Lista de partidos */}
      {filteredMatches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {filter === 'today' ? '😴' : '📭'}
          </div>
          <p className="empty-state-text">
            {filter === 'today' ? 'No hay partidos hoy'
              : stageFilter !== 'all'
                ? `No hay partidos de ${STAGES.find(s => s.key === stageFilter)?.label} aquí`
                : 'No hay partidos aquí'}
          </p>
        </div>
      ) : (
        <>
          {/* Indicador de resultados */}
          <div style={{
            fontSize: '12px', color: 'var(--text-muted)',
            marginBottom: '12px', textAlign: 'center'
          }}>
            {filteredMatches.length} partido{filteredMatches.length !== 1 ? 's' : ''}
            {stageFilter !== 'all' && ` · ${STAGES.find(s => s.key === stageFilter)?.label}`}
          </div>

          {filteredMatches.map(match => {
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
          })}
        </>
      )}
    </div>
  )
}

export default Matches