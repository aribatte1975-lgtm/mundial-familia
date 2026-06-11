import { useState, useEffect } from 'react'

const ACHIEVEMENTS = [
  {
    id: 'first_prediction',
    icon: '🎯',
    name: 'Primera Predicción',
    description: 'Hiciste tu primera predicción',
    check: (stats) => stats.totalPredictions >= 1
  },
  {
    id: 'five_predictions',
    icon: '✋',
    name: 'Mano Llena',
    description: '5 predicciones realizadas',
    check: (stats) => stats.totalPredictions >= 5
  },
  {
    id: 'ten_predictions',
    icon: '🔟',
    name: 'Imparable',
    description: '10 predicciones realizadas',
    check: (stats) => stats.totalPredictions >= 10
  },
  {
    id: 'twenty_predictions',
    icon: '🏃',
    name: 'Maratonista',
    description: '20 predicciones realizadas',
    check: (stats) => stats.totalPredictions >= 20
  },
  {
    id: 'fifty_predictions',
    icon: '🦾',
    name: 'Máquina',
    description: '50 predicciones realizadas',
    check: (stats) => stats.totalPredictions >= 50
  },
  {
    id: 'all_predictions',
    icon: '⚡',
    name: 'Rayo',
    description: 'Predijiste TODOS los partidos disponibles',
    check: (stats) => stats.totalPredictions > 0 && stats.missedPredictions === 0
  },
  {
    id: 'first_exact',
    icon: '⭐',
    name: 'Clarividente',
    description: 'Acertaste un resultado exacto',
    check: (stats) => stats.exactPredictions >= 1
  },
  {
    id: 'three_exact',
    icon: '🔮',
    name: 'Vidente',
    description: '3 resultados exactos',
    check: (stats) => stats.exactPredictions >= 3
  },
  {
    id: 'five_exact',
    icon: '🧙',
    name: 'Mago',
    description: '5 resultados exactos',
    check: (stats) => stats.exactPredictions >= 5
  },
  {
    id: 'ten_exact',
    icon: '👁️',
    name: 'El Oráculo',
    description: '10 resultados exactos',
    check: (stats) => stats.exactPredictions >= 10
  },
  {
    id: 'first_correct',
    icon: '✅',
    name: 'Buen Ojo',
    description: 'Acertaste tu primer ganador',
    check: (stats) => stats.correctPredictions >= 1
  },
  {
    id: 'ten_correct',
    icon: '🎯',
    name: 'Francotirador',
    description: '10 ganadores acertados',
    check: (stats) => (stats.correctPredictions + stats.exactPredictions) >= 10
  },
  {
    id: 'twenty_correct',
    icon: '🏹',
    name: 'Robin Hood',
    description: '20 ganadores acertados',
    check: (stats) => (stats.correctPredictions + stats.exactPredictions) >= 20
  },
  {
    id: 'streak_3',
    icon: '🔥',
    name: 'En Racha',
    description: 'Racha de 3 aciertos seguidos',
    check: (stats) => stats.bestStreak >= 3
  },
  {
    id: 'streak_5',
    icon: '🔥🔥',
    name: 'En Llamas',
    description: 'Racha de 5 aciertos seguidos',
    check: (stats) => stats.bestStreak >= 5
  },
  {
    id: 'streak_10',
    icon: '☄️',
    name: 'Meteoro',
    description: 'Racha de 10 aciertos seguidos',
    check: (stats) => stats.bestStreak >= 10
  },
  {
    id: 'no_wrong',
    icon: '🛡️',
    name: 'Invencible',
    description: '10+ predicciones sin fallar ninguna',
    check: (stats) => stats.totalPredictions >= 10 && stats.wrongPredictions === 0
  },
  {
    id: 'first_place',
    icon: '👑',
    name: 'Rey del Prode',
    description: 'Estar primero en el ranking',
    check: (stats) => stats.rankPosition === 1
  },
  {
    id: 'points_20',
    icon: '💎',
    name: 'Coleccionista',
    description: 'Acumular 20 puntos',
    check: (stats) => stats.totalPoints >= 20
  },
  {
    id: 'points_50',
    icon: '💰',
    name: 'Millonario',
    description: 'Acumular 50 puntos',
    check: (stats) => stats.totalPoints >= 50
  },
  {
    id: 'points_100',
    icon: '🏆',
    name: 'Leyenda',
    description: 'Acumular 100 puntos',
    check: (stats) => stats.totalPoints >= 100
  },
  {
    id: 'accuracy_80',
    icon: '🎪',
    name: 'Cirujano',
    description: '80%+ de acierto (mínimo 10 partidos)',
    check: (stats) => {
      if (stats.totalPredictions < 10) return false
      const accuracy = ((stats.correctPredictions + stats.exactPredictions) / stats.totalPredictions) * 100
      return accuracy >= 80
    }
  }
]

const Achievements = ({ stats, showAll = false }) => {
  const unlocked = ACHIEVEMENTS.filter(a => a.check(stats))
  const locked = ACHIEVEMENTS.filter(a => !a.check(stats))

  return (
    <div>
      {/* Desbloqueados */}
      {unlocked.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '16px' }}>🏅</span>
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>
              Logros desbloqueados ({unlocked.length}/{ACHIEVEMENTS.length})
            </h3>
          </div>

          {/* Barra de progreso */}
          <div style={{
            background: 'var(--bg-dark)',
            borderRadius: '10px',
            height: '8px',
            marginBottom: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, var(--secondary), var(--warning))',
              height: '100%',
              borderRadius: '10px',
              width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%`,
              transition: 'width 1s ease'
            }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '20px'
          }}>
            {unlocked.map(achievement => (
              <div key={achievement.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--secondary)',
                borderRadius: 'var(--radius)',
                padding: '12px 8px',
                textAlign: 'center',
                animation: 'bounceIn 0.5s ease-out',
                boxShadow: '0 0 15px rgba(212, 168, 67, 0.15)'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                  {achievement.icon}
                </div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'var(--secondary)',
                  lineHeight: '1.2'
                }}>
                  {achievement.name}
                </div>
                <div style={{
                  fontSize: '8px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  lineHeight: '1.2'
                }}>
                  {achievement.description}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bloqueados */}
      {showAll && locked.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '16px' }}>🔒</span>
            <h3 style={{
              fontSize: '15px', fontWeight: '700', margin: 0,
              color: 'var(--text-muted)'
            }}>
              Por desbloquear ({locked.length})
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {locked.map(achievement => (
              <div key={achievement.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 8px',
                textAlign: 'center',
                opacity: 0.4
              }}>
                <div style={{ fontSize: '28px', marginBottom: '4px', filter: 'grayscale(100%)' }}>
                  {achievement.icon}
                </div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  lineHeight: '1.2'
                }}>
                  {achievement.name}
                </div>
                <div style={{
                  fontSize: '8px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  lineHeight: '1.2'
                }}>
                  {achievement.description}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {unlocked.length === 0 && (
        <div className="empty-state" style={{ padding: '20px' }}>
          <div className="empty-state-icon">🔒</div>
          <p className="empty-state-text">Aún no tienes logros. ¡Empieza a predecir!</p>
        </div>
      )}
    </div>
  )
}

export { ACHIEVEMENTS }
export default Achievements