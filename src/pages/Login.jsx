import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUsers, loginUser } from '../lib/supabase'
import { Lock } from 'lucide-react'

const Login = () => {
  const [selectedUser, setSelectedUser] = useState(null)
  const [users, setUsers] = useState([])
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const { login } = useAuth()
  const navigate = useNavigate()

  useState(() => {
    getUsers().then(data => {
      setUsers(data)
      setLoadingUsers(false)
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!selectedUser) { setError('Selecciona tu perfil'); return }
    setLoading(true)
    const user = await loginUser(selectedUser.id, pin)
    setLoading(false)
    if (user) {
      login(user)
      navigate('/')
    } else {
      setError('PIN incorrecto 😅')
      setPin('')
    }
  }

  if (loadingUsers) {
    return (
      <div className="login-container">
        <div className="login-logo">🏆</div>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-logo">🏆</div>
      <h1 className="login-title">Mundial en Familia</h1>
      <p className="login-subtitle">¿Quién eres?</p>

      <form className="login-form" onSubmit={handleLogin}>
        <div className="login-avatars">
          {users.map(user => (
            <div
              key={user.id}
              className={`avatar-option ${selectedUser?.id === user.id ? 'selected' : ''}`}
              onClick={() => { setSelectedUser(user); setError(''); setPin('') }}
            >
              <span className="avatar-emoji">{user.emoji}</span>
              <span className="avatar-name">{user.name}</span>
            </div>
          ))}
        </div>

        {selectedUser && (
          <div className="animate-slide-up">
            <div className="input-group">
              <label>
                <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                PIN de {selectedUser.name}
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="input"
                placeholder="PIN de 4 dígitos"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
                autoFocus
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Entrando...' : '⚽ Entrar al Mundial'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default Login