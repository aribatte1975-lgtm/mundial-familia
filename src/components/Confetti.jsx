import { useEffect } from 'react'
import confetti from 'canvas-confetti'

const Confetti = ({ trigger, type = 'exact' }) => {
  useEffect(() => {
    if (!trigger) return

    if (type === 'exact') {
      // Confetti épico para resultado exacto ⭐
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF6B35']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF6B35']
        })

        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()

      // Explosión central
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6B35', '#8B1538', '#D4A843']
        })
      }, 500)

    } else if (type === 'correct') {
      // Confetti suave para acierto ✅
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      })
    }
  }, [trigger, type])

  return null
}

export default Confetti