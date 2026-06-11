import { Trophy, Flame, Target, Crosshair } from 'lucide-react'

const RankingTable = ({ ranking }) => {
  const getPositionClass = (index) => {
    switch (index) {
      case 0: return 'gold'
      case 1: return 'silver'
      case 2: return 'bronze'
      default: return 'normal'
    }
  }

  const getPositionEmoji = (index) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return index + 1
    }
  }

  return (
    <div>
      {ranking.map((player, index) => (
        <div 
          key={player.id} 
          className="ranking-item"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={`ranking-position ${getPositionClass(index)}`}>
            {getPositionEmoji(index)}
          </div>

          <div style={{ fontSize: '28px' }}>{player.emoji}</div>

          <div className="ranking-info">
            <div className="ranking-name">{player.name}</div>
            <div className="ranking-stats">
              <span style={{ color: 'var(--success)' }}>
                <Target size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {player.exactPredictions} exactos
              </span>
              {' · '}
              <span>
                <Crosshair size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {player.correctPredictions} aciertos
              </span>
              {player.currentStreak >= 2 && (
                <>
                  {' · '}
                  <span style={{ color: 'var(--warning)' }}>
                    <Flame size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {player.currentStreak} racha
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="ranking-points">
            <div className="ranking-points-value">{player.totalPoints}</div>
            <div className="ranking-points-label">puntos</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RankingTable