import { useState, useEffect, useCallback } from 'react'  
import {
  getRanking, getMatches, getPredictionsByUser,
  calculatePoints, getSettings, getPointsEvolution
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import RankingTable from '../components/RankingTable'
import Achievements from '../components/Achievements'
import { Trophy, BarChart3, Award, TrendingUp } from 'lucide-react'
import { useRealtime } from '../hooks/useRealtime'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend
} from 'recharts'

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
  const [evolution, setEvolution] = useState([])

  // ✅ useCallback para estabilizar la función y evitar recreaciones infinitas
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [r, m, s, evo] = await Promise.all([
        getRanking(), getMatches(), getSettings(), getPointsEvolution()
      ])
      setRanking(r)
      setFinishedMatches(m.filter(match => match.status === 'finished'))
      setSettings(s)
      setEvolution(evo)
      setSelectedAchievementPlayer(prev =>
        prev ? r.find(p => p.id === prev.id) : r.find(p => p.id === user?.id)
      )
    } catch (error) {
      console.error('Error cargando datos del ranking:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [user?.id])

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
        <button className={`tab ${view === 'evolution' ? 'active' : ''}`}
          onClick={() => setView('evolution')}>
          <TrendingUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Evolución
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

  {/* Tabla resumen */}
  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {[
      { label: '⭐ Resultado exacto 90min', val: `+${settings.pointsExact} pts`, color: 'var(--secondary)' },
      { label: '✅ Acertar ganador/empate', val: `+${settings.pointsCorrect} pts`, color: 'var(--success)' },
      { label: '🃏 Comodín', val: 'x2 todo', color: 'var(--info)' },
      { label: `🔥 Racha cada ${settings.bonusStreak} aciertos`, val: `+${settings.pointsBonus} pts`, color: 'var(--warning)' },
    ].map(item => (
      <div key={item.label} className="flex-between">
        <span>{item.label}</span>
        <span style={{ fontWeight: '700', color: item.color }}>{item.val}</span>
      </div>
    ))}
  </div>

  {/* Cómo funciona - general */}
  <div style={{
    marginTop: '12px', padding: '10px',
    background: 'var(--bg-dark)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '11px', color: 'var(--text-muted)',
    lineHeight: '1.7'
  }}>
    <div style={{ fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
      📖 Reglas generales
    </div>
    <div>⭐ Predecís 2-1 y sale 2-1 → <b style={{ color: 'var(--secondary)' }}>+{settings.pointsExact} pts</b></div>
    <div>✅ Predecís 2-1 y sale 3-0 (ganador correcto) → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect} pts</b></div>
    <div>❌ Fallás el ganador → <b style={{ color: 'var(--danger)' }}>0 pts</b></div>
    <div style={{ marginTop: '4px' }}>
      🃏 Comodín: <b style={{ color: 'var(--info)' }}>duplica todos los puntos</b> que ganés en ese partido
    </div>
    <div style={{ marginTop: '4px' }}>
      🔥 Racha: bonus de <b style={{ color: 'var(--warning)' }}>+{settings.pointsBonus} pts</b> por cada {settings.bonusStreak} aciertos <b>consecutivos</b> (no suma en cada partido, solo al completar el grupo de {settings.bonusStreak})
    </div>
  </div>

  {/* Eliminatorias */}
  <div style={{
    marginTop: '10px', padding: '10px',
    background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(212,168,67,0.06))',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '11px', color: 'var(--text-muted)',
    lineHeight: '1.7'
  }}>
    <div style={{ fontWeight: '700', marginBottom: '6px', color: 'var(--warning)' }}>
      🏆 Eliminatorias — bonus por resolución
    </div>
    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
      Si predecís empate en 90min, podés elegir cómo se resuelve y sumar puntos extra:
    </div>

    {/* Suplementario */}
    <div style={{
      padding: '8px', marginBottom: '6px',
      background: 'rgba(59,130,246,0.08)',
      border: '1px solid rgba(59,130,246,0.15)',
      borderRadius: 'var(--radius-sm)'
    }}>
      <div style={{ fontWeight: '700', color: 'var(--info)', marginBottom: '4px' }}>
        ⏱️ Si elegís Suplementario (prórroga):
      </div>
      <div>✅ Acertás empate 90min → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b></div>
      <div>⭐ + resultado exacto del empate → <b style={{ color: 'var(--secondary)' }}>+{settings.pointsExact - settings.pointsCorrect} más (total {settings.pointsExact})</b></div>
      <div>🎯 Acertás suplementario + quién clasifica → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b></div>
      <div style={{
        marginTop: '4px', fontSize: '10px', fontWeight: '700',
        color: 'var(--info)'
      }}>
        Máximo: {settings.pointsExact + settings.pointsCorrect} pts
        {' · '}con 🃏: {(settings.pointsExact + settings.pointsCorrect) * 2} pts
      </div>
    </div>

    {/* Penales */}
    <div style={{
      padding: '8px',
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.15)',
      borderRadius: 'var(--radius-sm)'
    }}>
      <div style={{ fontWeight: '700', color: 'var(--warning)', marginBottom: '4px' }}>
        ⚽ Si elegís Penales:
      </div>
      <div>✅ Acertás empate 90min → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b></div>
      <div>⭐ + resultado exacto del empate → <b style={{ color: 'var(--secondary)' }}>+{settings.pointsExact - settings.pointsCorrect} más (total {settings.pointsExact})</b></div>
      <div>🎯 Acertás penales + quién clasifica → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b></div>
      <div>🎯 + resultado exacto penales → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect} más</b></div>
      <div style={{
        marginTop: '4px', fontSize: '10px', fontWeight: '700',
        color: 'var(--warning)'
      }}>
        Máximo: {settings.pointsExact + settings.pointsCorrect + settings.pointsCorrect} pts
        {' · '}con 🃏: {(settings.pointsExact + settings.pointsCorrect + settings.pointsCorrect) * 2} pts
      </div>
    </div>
  </div>

  {/* Ejemplos */}
  <div style={{
    marginTop: '10px', padding: '10px',
    background: 'var(--bg-dark)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '10px', color: 'var(--text-muted)',
    lineHeight: '1.8'
  }}>
    <div style={{ fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '11px' }}>
      💡 Ejemplos prácticos
    </div>

    {/* Ejemplo 1: partido normal */}
    <div style={{
      marginBottom: '8px', paddingBottom: '8px',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '2px' }}>
        Partido normal: Argentina 3-0 (predijiste 2-0)
      </div>
      <div style={{ paddingLeft: '8px' }}>
        ✅ Acertaste ganador → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect} pts</b>
      </div>
    </div>

    {/* Ejemplo 2: suplementario */}
    <div style={{
      marginBottom: '8px', paddingBottom: '8px',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '2px' }}>
        Suplementario: 1-1 → clasifica Francia (predijiste 1-1, suplementario, Francia)
      </div>
      <div style={{ paddingLeft: '8px' }}>
        ⭐ Exacto 90min → <b style={{ color: 'var(--secondary)' }}>+{settings.pointsExact}</b>
      </div>
      <div style={{ paddingLeft: '8px' }}>
        🎯 Suplementario + clasificado → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b>
      </div>
      <div style={{ paddingLeft: '8px', fontWeight: '700', color: 'var(--secondary)' }}>
        Total: {settings.pointsExact + settings.pointsCorrect} pts
        {' · '}con 🃏: {(settings.pointsExact + settings.pointsCorrect) * 2} pts
      </div>
    </div>

    {/* Ejemplo 3: penales completo */}
    <div>
      <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '2px' }}>
        Penales: 1-1 → clasifica Argentina 4-2 (predijiste todo exacto)
      </div>
      <div style={{ paddingLeft: '8px' }}>
        ⭐ Exacto 90min → <b style={{ color: 'var(--secondary)' }}>+{settings.pointsExact}</b>
      </div>
      <div style={{ paddingLeft: '8px' }}>
        🎯 Penales + clasificado → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b>
      </div>
      <div style={{ paddingLeft: '8px' }}>
        🎯 Penales exactos → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b>
      </div>
      <div style={{ paddingLeft: '8px', fontWeight: '700', color: 'var(--secondary)' }}>
        Total: {settings.pointsExact + settings.pointsCorrect + settings.pointsCorrect} pts
        {' · '}con 🃏: {(settings.pointsExact + settings.pointsCorrect + settings.pointsCorrect) * 2} pts 🔥
      </div>
    </div>
  </div>


      {/* Ejemplo visual */}
      <div style={{
        marginTop: '10px', padding: '10px',
        background: 'var(--bg-dark)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '10px', color: 'var(--text-muted)',
        lineHeight: '1.8'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '11px' }}>
          💡 Ejemplo: Argentina 1-1 Cabo Verde (pen: 4-2)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div>
            Jugador predijo <b>1-1, clasifica Argentina, pen 4-2</b>
          </div>
          <div style={{ paddingLeft: '8px' }}>
            ⭐ Exacto 90min → <b style={{ color: 'var(--secondary)' }}>+{settings.pointsExact}</b>
          </div>
          <div style={{ paddingLeft: '8px' }}>
            ⚽ Acertó penales → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b>
          </div>
          <div style={{ paddingLeft: '8px' }}>
            🏆 Acertó clasificado → <b style={{ color: 'var(--success)' }}>+{settings.pointsCorrect}</b>
          </div>
          <div style={{ paddingLeft: '8px' }}>
            🎯 Penales exactos → <b style={{ color: 'var(--secondary)' }}>+{settings.pointsExact}</b>
          </div>
          <div style={{
            marginTop: '4px', paddingTop: '4px',
            borderTop: '1px solid var(--border)',
            fontWeight: '700', fontSize: '11px',
            color: 'var(--secondary)'
          }}>
            Total: {settings.pointsExact + settings.pointsCorrect + settings.pointsCorrect + settings.pointsExact} pts
            {' '}(con 🃏 = {(settings.pointsExact + settings.pointsCorrect + settings.pointsCorrect + settings.pointsExact) * 2} pts)
          </div>
        </div>
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
                    { val: `🃏${player.wildcardsUsed || 0}/3`, label: 'COMODÍN', color: 'var(--info)' },
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

      {/* EVOLUCIÓN */}
      {view === 'evolution' && (
        <div>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{
              fontSize: '13px', color: 'var(--text-muted)',
              marginBottom: '12px', textAlign: 'center'
            }}>
              Puntos acumulados partido a partido
            </div>

            {evolution.length > 0 && evolution[0].data.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart>
                  <XAxis
                    dataKey="matchNum"
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                    type="number"
                    domain={[1, evolution[0]?.data.length || 1]}
                    allowDecimals={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                    width={35}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      // Buscar el label del partido
                      const matchInfo = evolution[0]?.data.find(
                        d => d.matchNum === label
                      )
                      return (
                        <div style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          boxShadow: 'var(--shadow-lg)'
                        }}>
                          <div style={{
                            fontSize: '11px', color: 'var(--text-muted)',
                            marginBottom: '6px'
                          }}>
                            Partido {label} {matchInfo?.matchLabel || ''}
                          </div>
                          {payload
                            .sort((a, b) => b.value - a.value)
                            .map(entry => (
                              <div key={entry.dataKey} style={{
                                display: 'flex', alignItems: 'center',
                                gap: '6px', fontSize: '12px',
                                marginBottom: '2px'
                              }}>
                                <div style={{
                                  width: '8px', height: '8px',
                                  borderRadius: '50%',
                                  background: entry.color
                                }} />
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  {entry.name}
                                </span>
                                <span style={{
                                  marginLeft: 'auto',
                                  fontWeight: '700',
                                  color: entry.color
                                }}>
                                  {entry.value} pts
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      )
                    }}
                  />

                  {evolution.map((player, idx) => {
                    const colors = ['#D4A843', '#10B981', '#3B82F6', '#EF4444']
                    return (
                      <Line
                        key={player.id}
                        data={player.data}
                        dataKey="points"
                        name={`${player.emoji} ${player.name}`}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{
                          r: 5,
                          stroke: colors[idx % colors.length],
                          strokeWidth: 2,
                          fill: 'var(--bg-dark)'
                        }}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
                <p>Aún no hay partidos finalizados</p>
              </div>
            )}
          </div>

          {/* Leyenda con posición actual */}
          <div className="card" style={{ padding: '12px 16px' }}>
            {evolution
              .sort((a, b) => {
                const lastA = a.data[a.data.length - 1]?.points || 0
                const lastB = b.data[b.data.length - 1]?.points || 0
                return lastB - lastA
              })
              .map((player, idx) => {
                const colors = ['#D4A843', '#10B981', '#3B82F6', '#EF4444']
                const lastPoints = player.data[player.data.length - 1]?.points || 0
                const prevPoints = player.data.length > 1
                  ? player.data[player.data.length - 2]?.points || 0
                  : 0
                const diff = lastPoints - prevPoints
                const color = colors[evolution.findIndex(e => e.id === player.id) % colors.length]

                return (
                  <div key={player.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 0',
                    borderBottom: idx < evolution.length - 1
                      ? '1px solid var(--border)' : 'none'
                  }}>
                    <span style={{
                      fontSize: '12px', fontWeight: '800',
                      color: idx === 0 ? 'var(--secondary)' : 'var(--text-muted)',
                      width: '20px'
                    }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <div style={{
                      width: '10px', height: '10px',
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0
                    }} />
                    <span style={{ fontSize: '18px' }}>{player.emoji}</span>
                    <span style={{
                      flex: 1, fontSize: '13px', fontWeight: '600'
                    }}>
                      {player.name}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '16px', fontWeight: '800',
                        color: color
                      }}>
                        {lastPoints}
                      </span>
                      {diff > 0 && (
                        <span style={{
                          fontSize: '10px', color: 'var(--success)',
                          marginLeft: '4px', fontWeight: '700'
                        }}>
                          +{diff}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            }
          </div>
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