import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMatches, getRanking, getPredictionsByUser, calculatePoints, getSettings } from '../lib/supabase'
import { Trophy, Target, Calendar, ChevronRight, Flame } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MatchCard from '../components/MatchCard'

const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [nextMatches, setNextMatches] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [recentResults, setRecentResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [allRanking, allMatches, predictions, settings] = await Promise.all([
        getRanking(),
        getMatches(),
        getPredictionsByUser(user.id),
        getSettings()
      ])

      setRanking(allRanking)
      setMyStats(allRanking.find(r => r.id === user.id))

      const now = new Date()
      setNextMatches(
        allMatches.filter(m => m.status === 'upcoming' && new Date(m.datetime) > now).slice(0, 3)
      )

      const finished = allMatches.filter(m => m.status === 'finished').slice(-3).reverse()
      setRecentResults(finished.map(match => {
        const pred = predictions.find(p => p.matchId === match.id)
        const points = pred ? calculatePoints(pred, match, settings) : null
        return { match, prediction: pred, points }
      }))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const myPosition = ranking.findIndex(r => r.id === user.id) + 1

  if (loading) {
    return <div className="loading" style={{ minHeight: '60vh' }}><div className="loading-spinner" /></div>
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  padding: '16px 0 20px 0' 
}}>
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div style={{ fontSize: '52px', marginBottom: '4px' }}>{user.emoji}</div>
    <h1 style={{ fontSize: '22px', fontWeight: '800' }}>¡Hola, {user.name}!</h1>
    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
      {myPosition === 1 ? '¡Vas primero! 🔥' : 
       myPosition === 2 ? '¡Casi en la cima! 💪' : 
       '¡A por ellos! 🚀'}
    </p>
  </div>
</div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{myStats?.totalPoints || 0}</div>
          <div className="stat-label">Puntos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>#{myPosition || '-'}</div>
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

      {/* Mini ranking */}
      <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/ranking')}>
        <div className="flex-between mb-1">
          <h3 className="section-title" style={{ margin: 0 }}><Trophy size={18} /> Ranking</h3>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
        {ranking.map((player, i) => (
          <div key={player.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 0',
            borderBottom: i < ranking.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <span style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <span style={{ fontSize: '20px' }}>{player.emoji}</span>
            <span style={{
              flex: 1, fontWeight: player.id === user.id ? '700' : '400',
              color: player.id === user.id ? 'var(--secondary)' : 'var(--text-primary)'
            }}>
              {player.name}
            </span>
            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{player.totalPoints} pts</span>
          </div>
        ))}
      </div>

      {/* Próximos partidos */}
      {nextMatches.length > 0 && (
        <>
          <div className="flex-between mt-2 mb-1">
            <h3 className="section-title" style={{ margin: 0 }}><Calendar size={18} /> Próximos</h3>
            <span style={{ fontSize: '13px', color: 'var(--primary-light)', cursor: 'pointer' }}
              onClick={() => navigate('/predictions')}>
              Predecir →
            </span>
          </div>
          {nextMatches.map(match => <MatchCard key={match.id} match={match} />)}
        </>
      )}

      {/* Resultados recientes */}
      {recentResults.length > 0 && (
        <>
          <h3 className="section-title mt-2"><Target size={18} /> Últimos resultados</h3>
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
    </div>
  )
}

export default Home