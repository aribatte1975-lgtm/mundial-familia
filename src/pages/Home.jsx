import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getMatches, getRanking, getPredictionsByUser,
  calculatePoints, getSettings
} from '../lib/supabase'
import { Trophy, Target, Calendar, ChevronRight, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MatchCard from '../components/MatchCard'
import Countdown from '../components/Countdown'
import Confetti from '../components/Confetti'
import { useRealtimeMultiple } from '../hooks/useRealtime'

const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [todayMatches, setTodayMatches] = useState([])
  const [nextMatches, setNextMatches] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [recentResults, setRecentResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [confettiType, setConfettiType] = useState('exact')
  const [predictions, setPredictions] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const [updateFlash, setUpdateFlash] = useState(false)

  // ===== TIEMPO REAL =====
  useRealtimeMultiple(['matches', 'predictions'], (table, payload) => {
    console.log(`📡 Actualización en ${table}`)
    // Mostrar indicador visual de actualización
    setUpdateFlash(true)
    setTimeout(() => setUpdateFlash(false), 2000)
    setLastUpdate(new Date())
    // Recargar datos
    loadData(false)
  })

  useEffect(() => { loadData(true) }, [])

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [allRanking, allMatches, userPreds, s] = await Promise.all([
        getRanking(),
        getMatches(),
        getPredictionsByUser(user.id),
        getSettings()
      ])

      const prevStats = myStats
      setRanking(allRanking)
      setSettings(s)

      const myRankStats = allRanking.find(r => r.id === user.id)
      setMyStats(myRankStats)
      setPredictions(userPreds)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 86400000)

      setTodayMatches(
        allMatches.filter(m => {
          const d = new Date(m.datetime)
          return d >= today && d < tomorrow
        })
      )

      setNextMatches(
        allMatches
          .filter(m => m.status === 'upcoming' && new Date(m.datetime) >= tomorrow)
          .slice(0, 3)
      )

      const finished = allMatches.filter(m => m.status === 'finished').slice(-3).reverse()
      const results = finished.map(match => {
        const pred = userPreds.find(p => p.matchId === match.id)
        const points = pred ? calculatePoints(pred, match, s) : null
        return { match, prediction: pred, points }
      })
      setRecentResults(results)

      // Confetti si el último resultado fue acierto
      // Solo si los puntos cambiaron (nuevo resultado)
      if (prevStats && myRankStats && myRankStats.totalPoints > prevStats.totalPoints) {
        const diff = myRankStats.totalPoints - prevStats.totalPoints
        if (diff >= s.pointsExact) {
          setConfettiType('exact')
        } else {
          setConfettiType('correct')
        }
        setConfettiTrigger(prev => prev + 1)
      }

    } catch (e) {
      console.error('Error cargando datos:', e)
    }
    if (showLoading) setLoading(false)
  }, [user.id, myStats])

  const myPosition = ranking.findIndex(r => r.id === user.id) + 1
  const todayNoPrediction = todayMatches.filter(m =>
    m.status === 'upcoming' && !predictions.find(p => p.matchId === m.id)
  )

  if (loading) return (
    <div className="loading" style={{ minHeight: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      <Confetti trigger={confettiTrigger} type={confettiType} />

      {/* Indicador tiempo real */}
      {updateFlash && (
        <div style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--success)',
          color: 'white',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
        }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
            🔄
          </span>
          ¡Datos actualizados!
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '52px', marginBottom: '4px' }}>{user.emoji}</div>
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>¡Hola, {user.name}!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {myPosition === 1 ? '¡Vas primero! 🔥' :
           myPosition === 2 ? '¡Casi en la cima! 💪' :
           '¡A por ellos! 🚀'}
        </p>
        {lastUpdate && (
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
            🟢 En vivo · actualizado {lastUpdate.toLocaleTimeString('es-ES', {
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            })}
          </p>
        )}
      </div>

      {/* Alerta partidos hoy sin predicción */}
      {todayNoPrediction.length > 0 && (
        <div onClick={() => navigate('/predictions')} style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          marginBottom: '16px',
          cursor: 'pointer',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--danger)' }}>
                ¡{todayNoPrediction.length} partido{todayNoPrediction.length > 1 ? 's' : ''} hoy sin predicción!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Toca aquí para predecir antes de que empiecen
              </div>
            </div>
            <ChevronRight size={18} color="var(--danger)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{myStats?.totalPoints || 0}</div>
          <div className="stat-label">Puntos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            #{myPosition || '-'}
          </div>
          <div className="stat-label">Posición</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--accent-light)' }}>
            {myStats?.exactPredictions || 0}
          </div>
          <div className="stat-label">Exactos ⭐</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--warning)' }}>
            🔥{myStats?.currentStreak || 0}
          </div>
          <div className="stat-label">Racha</div>
        </div>
      </div>

      {/* Partidos de HOY */}
      {todayMatches.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px', marginTop: '8px'
          }}>
            <div style={{
              background: 'var(--danger)', borderRadius: '50%',
              width: '8px', height: '8px',
              animation: 'pulse 1.5s infinite'
            }} />
            <h3 className="section-title" style={{ margin: 0 }}>
              <Clock size={18} /> Hoy — {new Date().toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </h3>
          </div>

          {todayMatches.map(match => {
            const pred = predictions.find(p => p.matchId === match.id)
            const isUpcoming = match.status === 'upcoming'
            const isFinished = match.status === 'finished'
            const points = pred && isFinished ? calculatePoints(pred, match, settings) : null

            return (
              <div key={match.id} style={{ position: 'relative' }}>
                <MatchCard match={match}>
                  {isUpcoming && <Countdown targetDate={match.datetime} />}

                  {pred && isUpcoming && (
                    <div style={{
                      marginTop: '8px', padding: '8px 12px',
                      background: 'var(--bg-dark)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Tu predicción:{' '}
                      </span>
                      <span style={{
                        fontSize: '16px', fontWeight: '700',
                        color: 'var(--secondary)'
                      }}>
                        {pred.homeScore} - {pred.awayScore}
                      </span>
                    </div>
                  )}

                  {!pred && isUpcoming && (
                    <div onClick={() => navigate('/predictions')} style={{
                      marginTop: '8px', padding: '10px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px dashed var(--danger)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center', cursor: 'pointer',
                      color: 'var(--danger)', fontSize: '13px', fontWeight: '600'
                    }}>
                      ⚠️ ¡Sin predicción! Toca para predecir
                    </div>
                  )}

                  {isFinished && pred && points && (
                    <div className={`prediction-result ${points.type}`}>
                      <span>Tu predicción: {pred.homeScore}-{pred.awayScore}</span>
                      <span style={{ marginLeft: 'auto' }}>
                        {points.type === 'exact' ? `⭐ +${points.points}` :
                         points.type === 'correct' ? `✅ +${points.points}` : '❌ +0'}
                      </span>
                    </div>
                  )}
                </MatchCard>
              </div>
            )
          })}
        </>
      )}

      {todayMatches.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>😴</div>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>No hay partidos hoy</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {nextMatches.length > 0 ? 'Próximo partido 👇' : 'El Mundial aún no comienza'}
          </p>
        </div>
      )}

      {/* Mini Ranking */}
      <div className="card mt-2" style={{ cursor: 'pointer' }}
        onClick={() => navigate('/ranking')}>
        <div className="flex-between mb-1">
          <h3 className="section-title" style={{ margin: 0 }}>
            <Trophy size={18} /> Ranking
          </h3>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
        {ranking.map((player, i) => (
          <div key={player.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 0',
            borderBottom: i < ranking.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <span style={{ fontSize: '20px' }}>{player.emoji}</span>
            <span style={{
              flex: 1,
              fontWeight: player.id === user.id ? '700' : '400',
              color: player.id === user.id ? 'var(--secondary)' : 'var(--text-primary)'
            }}>
              {player.name}
            </span>
            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>
              {player.totalPoints} pts
            </span>
          </div>
        ))}
      </div>

      {/* Próximos */}
      {nextMatches.length > 0 && (
        <>
          <div className="flex-between mt-2 mb-1">
            <h3 className="section-title" style={{ margin: 0 }}>
              <Calendar size={18} /> Próximos
            </h3>
            <span
              style={{ fontSize: '13px', color: 'var(--primary-light)', cursor: 'pointer' }}
              onClick={() => navigate('/predictions')}
            >
              Predecir →
            </span>
          </div>
          {nextMatches.map(match => (
            <MatchCard key={match.id} match={match}>
              <Countdown targetDate={match.datetime} />
            </MatchCard>
          ))}
        </>
      )}

      {/* Últimos resultados */}
      {recentResults.length > 0 && (
        <>
          <h3 className="section-title mt-2">
            <Target size={18} /> Últimos resultados
          </h3>
          {recentResults.map(({ match, prediction, points }) => (
            <MatchCard key={match.id} match={match}>
              {prediction && points ? (
                <div className={`prediction-result ${points.type}`}>
                  <span>Tu predicción: {prediction.homeScore}-{prediction.awayScore}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    {points.type === 'exact' ? `⭐ +${points.points}` :
                     points.type === 'correct' ? `✅ +${points.points}` : '❌ +0'}
                  </span>
                </div>
              ) : (
                <div className="prediction-result wrong">
                  <span>No predijiste este partido</span>
                </div>
              )}
            </MatchCard>
          ))}
        </>
      )}

      <div style={{
        textAlign: 'center', padding: '20px 0 10px',
        fontSize: '11px', color: 'var(--text-muted)'
      }}>
        ⚽ Mundial en Familia 2026 🏆
      </div>
    </div>
  )
}

export default Home