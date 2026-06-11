import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const MatchCard = ({ match, prediction, showPrediction = false, children }) => {
  const matchDate = new Date(match.datetime)
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const isLocked = match.status === 'locked'

  const getStatusLabel = () => {
    switch (match.status) {
      case 'finished': return 'Finalizado'
      case 'live': return '🔴 EN VIVO'
      case 'locked': return 'Bloqueado'
      default: return format(matchDate, "HH:mm", { locale: es })
    }
  }

  const getStatusClass = () => {
    switch (match.status) {
      case 'finished': return 'finished'
      case 'live': return 'live'
      case 'locked': return 'locked'
      default: return 'upcoming'
    }
  }

  return (
    <div className={`match-card ${isFinished ? '' : ''}`}>
      <div className="match-card-header">
        <span className="group-badge">{match.group || match.stage}</span>
        <span className={`match-status ${getStatusClass()}`}>
          {getStatusLabel()}
        </span>
      </div>

      <div className="match-teams">
        <div className="match-team">
          <div className="team-flag">{match.homeFlag}</div>
          <span className="team-name">{match.homeTeam}</span>
        </div>

        <div className="match-score">
          {isFinished || isLive ? (
            <>
              <span>{match.homeScore}</span>
              <span className="match-vs">-</span>
              <span>{match.awayScore}</span>
            </>
          ) : (
            <span className="match-vs">VS</span>
          )}
        </div>

        <div className="match-team">
          <div className="team-flag">{match.awayFlag}</div>
          <span className="team-name">{match.awayTeam}</span>
        </div>
      </div>

      {!isFinished && !isLive && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {format(matchDate, "EEEE d 'de' MMMM", { locale: es })}
          </span>
        </div>
      )}

      {showPrediction && prediction && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px 12px', 
          background: 'var(--bg-dark)', 
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tu predicción: </span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--secondary)' }}>
            {prediction.homeScore} - {prediction.awayScore}
          </span>
        </div>
      )}

      {children}
    </div>
  )
}

export default MatchCard