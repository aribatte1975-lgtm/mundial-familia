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

      {/* Indicador resolución: suplementario o penales */}
      {isFinished && match.resolutionType && match.resolutionType !== 'regular' && (
        <div style={{
          textAlign: 'center', marginTop: '6px', padding: '6px 12px',
          background: match.resolutionType === 'penalties'
            ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
          border: `1px solid ${match.resolutionType === 'penalties'
            ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`,
          borderRadius: 'var(--radius-sm)'
        }}>
          {match.resolutionType === 'extra_time' && (
            <>
              <div style={{ fontSize: '11px', color: 'var(--info)', fontWeight: '700' }}>
                ⏱️ Prórroga
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Clasifica: <b style={{ color: 'var(--success)' }}>
                  {match.penaltyWinner}
                </b>
              </div>
            </>
          )}
          {match.resolutionType === 'penalties' && (
            <>
              <div style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: '700' }}>
                ⚽ Penales
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', marginTop: '4px'
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: match.penaltyWinner === match.homeTeam ? '700' : '400',
                  color: match.penaltyWinner === match.homeTeam ? 'var(--success)' : 'var(--text-muted)'
                }}>
                  {match.homeTeam}
                </span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--warning)' }}>
                  {match.penaltyHome} - {match.penaltyAway}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: match.penaltyWinner === match.awayTeam ? '700' : '400',
                  color: match.penaltyWinner === match.awayTeam ? 'var(--success)' : 'var(--text-muted)'
                }}>
                  {match.awayTeam}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--success)', fontWeight: '600', marginTop: '2px' }}>
                Clasifica: {match.penaltyWinner} ✅
              </div>
            </>
          )}
        </div>
      )}


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
          {prediction.penaltyWinner && (
            <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '2px' }}>
              ⚽ Penales: {prediction.penaltyHome}-{prediction.penaltyAway} · Clasifica {prediction.penaltyWinner}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  )
}

export default MatchCard