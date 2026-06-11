import { useState } from 'react'
import { Minus, Plus, Check } from 'lucide-react'

const PredictionForm = ({ match, initialHome = 0, initialAway = 0, onSave, disabled = false }) => {
  const [homeScore, setHomeScore] = useState(initialHome)
  const [awayScore, setAwayScore] = useState(initialAway)
  const [saved, setSaved] = useState(false)

  const increment = (setter, value) => {
    if (!disabled) setter(Math.min(value + 1, 20))
  }

  const decrement = (setter, value) => {
    if (!disabled) setter(Math.max(value - 1, 0))
  }

  const handleSave = () => {
    if (disabled) return
    onSave(homeScore, awayScore)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <div className="prediction-score-input" style={{ justifyContent: 'center' }}>
        <div className="score-input-group">
          <button className="score-btn" onClick={() => increment(setHomeScore, homeScore)} disabled={disabled}>
            <Plus size={16} />
          </button>
          <div className="score-display">{homeScore}</div>
          <button className="score-btn" onClick={() => decrement(setHomeScore, homeScore)} disabled={disabled}>
            <Minus size={16} />
          </button>
        </div>

        <span className="score-separator">-</span>

        <div className="score-input-group">
          <button className="score-btn" onClick={() => increment(setAwayScore, awayScore)} disabled={disabled}>
            <Plus size={16} />
          </button>
          <div className="score-display">{awayScore}</div>
          <button className="score-btn" onClick={() => decrement(setAwayScore, awayScore)} disabled={disabled}>
            <Minus size={16} />
          </button>
        </div>
      </div>

      <button 
        className={`btn ${saved ? 'btn-success' : 'btn-primary'} ${disabled ? 'btn-disabled' : ''}`}
        onClick={handleSave}
        disabled={disabled}
        style={{ marginTop: '12px' }}
      >
        {saved ? (
          <><Check size={18} /> ¡Guardado!</>
        ) : disabled ? (
          'Partido bloqueado'
        ) : (
          '⚽ Guardar Predicción'
        )}
      </button>
    </div>
  )
}

export default PredictionForm