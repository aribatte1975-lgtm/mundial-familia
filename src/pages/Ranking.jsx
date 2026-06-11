import { useState, useEffect, useCallback } from 'react'  // ← agregar useCallback
import {
  getRanking, getMatches, getPredictionsByUser,
  calculatePoints, getSettings
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import RankingTable from '../components/RankingTable'
import Achievements from '../components/Achievements'
import { Trophy, BarChart3, Award } from 'lucide-react'
import { useRealtime } from '../hooks/useRealtime'

const Ranking = () => {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [view, setView] = useState('ranking')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [finishedMatches, setFinishedMatches] = useState([])
  const [allPredictions, setAllPredictions] = useState({})
  const [settings, setSettings] = useState({ pointsExact: 5, pointsCorrect: 3 })
  const [loading, setLoading] = useState(true)
  const [selectedAchievementPlayer, setSelectedAchievementPlayer] = useState(null)
  const [updateFlash, setUpdateFlash] = useState(false)

  // ✅ useCallback para estabilizar la función y evitar recreaciones infinitas
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [r, m, s] = await Promise.all([getRanking(), getMatches(), getSettings()])
      setRanking(r)
      setFinishedMatches(m.filter(match => match.status === 'finished'))
      setSettings(s)
      setSelectedAchievementPlayer(prev =>
        prev ? r.find(p => p.id === prev.id) : r.find(p => p.id === user?.id)
      )
    } catch (error) {
      console.error('Error cargando datos del ranking:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [user?.id])  // ← solo se recrea si cambia el usuario

  // ✅ Realtime - escuchar cambios en matches
  useRealtime('matches', () => {
    setUpdateFlash(true)
    setTimeout(() => setUpdateFlash(false), 2000)
    loadData(false)
  })

  // ✅ Realtime - escuchar cambios en predictions
  useRealtime('predictions', () => {
    loadData(false)
  })

  // ✅ Carga inicial
  useEffect(() => {
    loadData(true)
  }, [loadData])

  const loadPlayerPredictions = async (playerId) => {
    if (allPredictions[playerId]) return
    try {
      const preds = await getPredictionsByUser(playerId)
      setAllPredictions(prev => ({ ...prev, [playerId]: preds }))
    } catch (error) {
      console.error('Error cargando predicciones:', error)
    }
  }

  const handleSelectPlayer = async (playerId) => {
    if (selectedPlayer === playerId) {
      setSelectedPlayer(null)
      return
    }
    setSelectedPlayer(playerId)
    await loadPlayerPredictions(playerId)
  }

  const getAchievementStats = (player) => ({
    ...player,
    missedPredictions: Math.max(0, finishedMatches.length - player.totalPredictions),
    rankPosition: ranking.findIndex(r => r.id === player.id) + 1,
    finishedMatches: finishedMatches.length
  })

  if (loading) return (
    <div className="loading" style={{ minHeight: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Indicador actualización */}
      {updateFlash && (
        <div style={{
          position: 'fixed', top: '12px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--success)', color: 'white',
          padding: '6px 16px', borderRadius: '20px',
          fontSize: '12px', fontWeight: '700',
          zIndex: 9998, animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
        }}>
          🔄 Ranking actualizado
        </div>
      )}

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

      {/* RANKING */}
      {view === 'ranking' && (
        <>
          <RankingTable ranking={ranking} />
          <div className="card mt-2" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              📋 Sistema de puntos
            </h4>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: '⭐ Resultado exacto', val: `+${settings.pointsExact} pts`, color: 'var(--secondary)' },
                { label: '✅ Acertar ganador/empate', val: `+${settings.pointsCorrect} pts`, color: 'var(--success)' },
                { label: `🔥 Bonus racha (${settings.bonusStreak} aciertos)`, val: `+${settings.pointsBonus} pts`, color: 'var(--warning)' },
              ].map(item => (
                <div key={item.label} className="flex-between">
                  <span>{item.label}</span>
                  <span style={{ fontWeight: '700', color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* DETALLE - sin cambios */}
      {view === 'stats' && (
        <div>
          {ranking.map(player => {
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
                  display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                  gap: '8px', marginTop: '12px', padding: '12px',
                  background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)'
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
                          padding: '6px 0', borderBottom: '1px solid var(--border)',
                          fontSize: '12px'
                        }}>
                          <span>{match.homeFlag}</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {match.homeScore}-{match.awayScore}
                          </span>
                          <span>{match.awayFlag}</span>
                          <span style={{ flex: 1 }} />
                          {pred ? (
                            <>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {pred.homeScore}-{pred.awayScore}
                              </span>
                              <span className={`points-earned ${points?.type}`}
                                style={{ fontSize: '11px' }}>
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

      {/* LOGROS - sin cambios */}
      {view === 'achievements' && (
        <div>
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '16px',
            justifyContent: 'center'
          }}>
            {ranking.map(player => (
              <div key={player.id}
                onClick={() => setSelectedAchievementPlayer(player)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '4px', padding: '10px 14px',
                  background: selectedAchievementPlayer?.id === player.id
                    ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: selectedAchievementPlayer?.id === player.id
                    ? '2px solid var(--secondary)' : '2px solid var(--border)',
                  borderRadius: 'var(--radius)', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
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
                  {selectedAchievementPlayer.totalPoints} puntos ·{' '}
                  {selectedAchievementPlayer.totalPredictions} predicciones
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