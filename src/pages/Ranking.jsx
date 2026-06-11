import { useState, useEffect } from 'react'
import { getRanking, getMatches, getPredictionsByUser, calculatePoints, getSettings } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import RankingTable from '../components/RankingTable'
import Achievements from '../components/Achievements'
import { Trophy, BarChart3, Award } from 'lucide-react'

const Ranking = () => {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [view, setView] = useState('ranking')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [finishedMatches, setFinishedMatches] = useState([])
  const [allMatches, setAllMatches] = useState([])
  const [allPredictions, setAllPredictions] = useState({})
  const [settings, setSettings] = useState({ pointsExact: 5, pointsCorrect: 3 })
  const [loading, setLoading] = useState(true)
  const [selectedAchievementPlayer, setSelectedAchievementPlayer] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [r, m, s] = await Promise.all([getRanking(), getMatches(), getSettings()])
    setRanking(r)
    setAllMatches(m)
    setFinishedMatches(m.filter(match => match.status === 'finished'))
    setSettings(s)
    // Por defecto mostrar logros del usuario actual
    setSelectedAchievementPlayer(r.find(p => p.id === user.id))
    setLoading(false)
  }

  const loadPlayerPredictions = async (playerId) => {
    if (allPredictions[playerId]) return
    const preds = await getPredictionsByUser(playerId)
    setAllPredictions(prev => ({ ...prev, [playerId]: preds }))
  }

  const handleSelectPlayer = async (playerId) => {
    if (selectedPlayer === playerId) { setSelectedPlayer(null); return }
    setSelectedPlayer(playerId)
    await loadPlayerPredictions(playerId)
  }

  // Calcular stats extra para logros
  const getAchievementStats = (player) => {
    const finishedCount = finishedMatches.length
    const predCount = player.totalPredictions
    const missedPredictions = finishedCount - predCount
    const rankPosition = ranking.findIndex(r => r.id === player.id) + 1

    return {
      ...player,
      missedPredictions: Math.max(0, missedPredictions),
      rankPosition,
      finishedMatches: finishedCount
    }
  }

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="loading-spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🏆 Ranking Familiar</h1>
        <p>¿Quién es el mejor pronosticador?</p>
      </div>

      <div className="tabs">
        <button className={`tab ${view === 'ranking' ? 'active' : ''}`}
          onClick={() => setView('ranking')}>
          <Trophy size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Ranking
        </button>
        <button className={`tab ${view === 'stats' ? 'active' : ''}`}
          onClick={() => setView('stats')}>
          <BarChart3 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Detalle
        </button>
        <button className={`tab ${view === 'achievements' ? 'active' : ''}`}
          onClick={() => setView('achievements')}>
          <Award size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Logros
        </button>
      </div>

      {/* ===== RANKING ===== */}
      {view === 'ranking' && (
        <>
          <RankingTable ranking={ranking} />
          <div className="card mt-2" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              📋 Sistema de puntos
            </h4>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="flex-between">
                <span>⭐ Resultado exacto</span>
                <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>+{settings.pointsExact} pts</span>
              </div>
              <div className="flex-between">
                <span>✅ Acertar ganador/empate</span>
                <span style={{ fontWeight: '700', color: 'var(--success)' }}>+{settings.pointsCorrect} pts</span>
              </div>
              <div className="flex-between">
                <span>🔥 Bonus racha ({settings.bonusStreak} aciertos)</span>
                <span style={{ fontWeight: '700', color: 'var(--warning)' }}>+{settings.pointsBonus} pts</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== DETALLE ===== */}
      {view === 'stats' && (
        <div>
          {ranking.map((player) => {
            const preds = allPredictions[player.id] || []
            return (
              <div key={player.id} className="card" style={{ marginBottom: '16px' }}>
                <div className="flex-between" style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectPlayer(player.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '28px' }}>{player.emoji}</span>
                    <div>
                      <div style={{ fontWeight: '700' }}>{player.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {player.totalPredictions} predicciones
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--secondary)' }}>
                      {player.totalPoints}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PUNTOS</div>
                  </div>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px',
                  marginTop: '12px', padding: '12px', background: 'var(--bg-dark)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {[
                    { val: player.exactPredictions, label: 'EXACTOS', color: 'var(--secondary)' },
                    { val: player.correctPredictions, label: 'ACIERTOS', color: 'var(--success)' },
                    { val: player.wrongPredictions, label: 'FALLOS', color: 'var(--danger)' },
                    { val: `🔥${player.bestStreak}`, label: 'RACHA', color: 'var(--warning)' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {selectedPlayer === player.id && (
                  <div className="animate-slide-up" style={{ marginTop: '12px' }}>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Partido por partido:
                    </h4>
                    {finishedMatches.map(match => {
                      const pred = preds.find(p => p.matchId === match.id)
                      const points = pred ? calculatePoints(pred, match, settings) : null
                      return (
                        <div key={match.id} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '12px'
                        }}>
                          <span>{match.homeFlag}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{match.homeScore}-{match.awayScore}</span>
                          <span>{match.awayFlag}</span>
                          <span style={{ flex: 1 }} />
                          {pred ? (
                            <>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {pred.homeScore}-{pred.awayScore}
                              </span>
                              <span className={`points-earned ${points?.type}`} style={{ fontSize: '11px' }}>
                                {points?.type === 'exact' ? `⭐+${points.points}` :
                                 points?.type === 'correct' ? `✅+${points.points}` : '❌'}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ===== LOGROS ===== */}
      {view === 'achievements' && (
        <div>
          {/* Selector de jugador */}
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '16px',
            justifyContent: 'center'
          }}>
            {ranking.map(player => (
              <div
                key={player.id}
                onClick={() => setSelectedAchievementPlayer(player)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '4px', padding: '10px 14px',
                  background: selectedAchievementPlayer?.id === player.id
                    ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: selectedAchievementPlayer?.id === player.id
                    ? '2px solid var(--secondary)' : '2px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>{player.emoji}</span>
                <span style={{
                  fontSize: '10px', fontWeight: '600',
                  color: selectedAchievementPlayer?.id === player.id
                    ? 'var(--secondary)' : 'var(--text-muted)'
                }}>
                  {player.name}
                </span>
              </div>
            ))}
          </div>

          {/* Logros del jugador seleccionado */}
          {selectedAchievementPlayer && (
            <div className="animate-fade-in">
              <div style={{
                textAlign: 'center', marginBottom: '16px', padding: '12px',
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: '36px' }}>{selectedAchievementPlayer.emoji}</span>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '4px' }}>
                  {selectedAchievementPlayer.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedAchievementPlayer.totalPoints} puntos · {selectedAchievementPlayer.totalPredictions} predicciones
                </p>
              </div>

              <Achievements
                stats={getAchievementStats(selectedAchievementPlayer)}
                showAll={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Ranking