import { useState, useEffect } from 'react'

const Countdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))

  function getTimeLeft(target) {
    const now = new Date()
    const diff = new Date(target) - now

    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    const seconds = Math.floor((diff / 1000) % 60)

    return { days, hours, minutes, seconds, total: diff }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const tl = getTimeLeft(targetDate)
      setTimeLeft(tl)
      if (!tl) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '6px', color: 'var(--danger)', fontSize: '13px', fontWeight: '700'
      }}>
        <span style={{ animation: 'pulse 1.5s infinite' }}>🔴</span>
        <span>¡En juego!</span>
      </div>
    )
  }

  // Menos de 1 hora → mostrar en rojo
  const isUrgent = timeLeft.total < 3600000
  // Menos de 3 horas
  const isSoon = timeLeft.total < 10800000

  const color = isUrgent ? 'var(--danger)' : isSoon ? 'var(--warning)' : 'var(--info)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '4px', marginTop: '8px'
    }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⏱️</span>
      <div style={{
        display: 'flex', gap: '4px', alignItems: 'center'
      }}>
        {timeLeft.days > 0 && (
          <TimeBlock value={timeLeft.days} label="d" color={color} />
        )}
        <TimeBlock value={timeLeft.hours} label="h" color={color} />
        <TimeBlock value={timeLeft.minutes} label="m" color={color} />
        <TimeBlock value={timeLeft.seconds} label="s" color={color} />
      </div>
      {isUrgent && (
        <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '600', marginLeft: '4px' }}>
          ¡Corre!
        </span>
      )}
    </div>
  )
}

const TimeBlock = ({ value, label, color }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: '1px'
  }}>
    <span style={{
      background: 'var(--bg-dark)',
      border: `1px solid ${color}30`,
      borderRadius: '6px',
      padding: '3px 6px',
      fontSize: '14px',
      fontWeight: '800',
      color,
      minWidth: '28px',
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums'
    }}>
      {String(value).padStart(2, '0')}
    </span>
    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600' }}>
      {label}
    </span>
  </div>
)

export default Countdown