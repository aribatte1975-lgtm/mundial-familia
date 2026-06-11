import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getSpecialPredictions, getSpecialResults,
  saveSpecialPrediction, getUsers
} from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import { Trophy, Lock, Check, Eye, EyeOff } from 'lucide-react'
import { TEAMS } from '../data/teams'
import { TOP_SCORERS } from '../data/topScorers'


const SPECIAL_TYPES = [
  {
    type: 'champion',
    icon: '🏆',
    title: 'Campeón del Mundial',
    description: 'Elige qué selección ganará el Mundial 2026',
    points: 20,
    useTeams: true
  },
  {
    type: 'runner_up',
    icon: '🥈',
    title: 'Subcampeón',
    description: 'Elige quién será el subcampeón',
    points: 10,
    useTeams: true
  },
  {
    type: 'top_scorer',
    icon: '👟',
    title: 'Goleador del Mundial',
    description: 'Elige quién será el máximo goleador del torneo',
    points: 15,
    useTeams: false,
    useScorers: true   // ← nuevo flag para usar la lista de goleadores
  },
  {
    type: 'surprise',
    icon: '🤯',
    title: 'Sorpresa del Mundial',
    description: 'Elige un equipo "débil" que llegará lejos',
    points: 15,
    useTeams: true
  },
  {
    type: 'argentina_result',
    icon: '🇦🇷',
    title: '¿Hasta dónde llega Argentina?',
    description: 'Elige en qué fase se eliminará Argentina',
    points: 10,
    useTeams: false,
    options: [
      { value: 'Fase de Grupos', flag: '😢' },
      { value: 'Dieciseisavos', flag: '😕' },
      { value: 'Octavos', flag: '😐' },
      { value: 'Cuartos', flag: '😊' },
      { value: 'Semifinal', flag: '🔥' },
      { value: 'Final (pierde)', flag: '😤' },
      { value: 'Campeón', flag: '🏆' },
    ]
  },
  {
    type: 'total_goals',
    icon: '⚽',
    title: 'Goles totales del Mundial',
    description: 'Adivina cuántos goles se marcarán en total',
    points: 10,
    useTeams: false,
    freeText: true,
    placeholder: 'Ej: 172'
  }
]

// Fecha límite: antes del primer partido
const DEADLINE = new Date('2026-06-15T22:00:00Z')

const Special = () => {
  const { user } = useAuth()
  const [allPredictions, setAllPredictions] = useState([])
  const [myPredictions, setMyPredictions] = useState({})
  const [results, setResults] = useState([])
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [showSearch, setShowSearch] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [freeTextValues, setFreeTextValues] = useState({})

  const isLocked = new Date() >= DEADLINE
  const now = new Date()

  // Tiempo real
  useRealtime('special_predictions', () => loadData(false))
  useRealtime('special_results', () => loadData(false))

  useEffect(() => { loadData(true) }, [])

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const [preds, res, u] = await Promise.all([
      getSpecialPredictions(),
      getSpecialResults(),
      getUsers()
    ])
    setAllPredictions(preds)
    setResults(res)
    setUsers(u)

    const myPreds = {}
    preds.filter(p => p.userId === user.id).forEach(p => {
      myPreds[p.type] = p
    })
    setMyPredictions(myPreds)

    if (showLoading) setLoading(false)
  }

  const handleSave = async (type, value, flag) => {
    setSaving(type)
    const result = await saveSpecialPrediction(user.id, type, value, flag)
    setSaving(null)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      setMyPredictions(prev => ({
        ...prev,
        [type]: { userId: user.id, type, value, flag }
      }))
      setShowSearch(null)
      setSearchTerm('')
      showToast('¡Predicción guardada! 🎯', 'success')
    }
  }

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filteredTeams = TEAMS.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="loading" style={{ minHeight: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>🎯 Predicciones Especiales</h1>
        <p>
          {isLocked
            ? '🔒 Las predicciones están cerradas'
            : '¡Predice antes del 15 de junio!'}
        </p>
      </div>

      {/* Countdown hasta cierre */}
      {!isLocked && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,168,67,0.1), rgba(139,21,56,0.1))',
          border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--secondary)' }}>
            ⏰ Se cierran al empezar el Mundial (15 junio 2026)
          </span>
        </div>
      )}

      {/* Cada tipo de predicción especial */}
      {SPECIAL_TYPES.map(special => {
        const myPred = myPredictions[special.type]
        const result = results.find(r => r.type === special.type)
        const isCorrect = result && myPred &&
          myPred.value.toLowerCase() === result.value.toLowerCase()

        return (
          <div key={special.type} className="card" style={{
            marginBottom: '16px',
            borderColor: isCorrect ? 'var(--success)' :
                        result && myPred && !isCorrect ? 'var(--danger)' : 'var(--border)',
            boxShadow: isCorrect ? '0 0 20px rgba(16,185,129,0.2)' : 'none'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '32px' }}>{special.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{special.title}</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {special.description}
                </p>
              </div>
              <div style={{
                background: 'var(--bg-dark)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: '12px', fontWeight: '700',
                color: 'var(--secondary)'
              }}>
                +{special.points}pts
              </div>
            </div>

            {/* Mi predicción actual */}
            {myPred && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px',
                background: isCorrect ? 'rgba(16,185,129,0.1)' :
                           result && !isCorrect ? 'rgba(239,68,68,0.1)' : 'var(--bg-dark)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '10px',
                border: isCorrect ? '1px solid rgba(16,185,129,0.3)' :
                        result && !isCorrect ? '1px solid rgba(239,68,68,0.2)' : 'none'
              }}>
                <Check size={16} color={isCorrect ? 'var(--success)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Tu predicción:
                </span>
                <span style={{ fontSize: '20px' }}>{myPred.flag}</span>
                <span style={{
                  fontWeight: '700', fontSize: '14px',
                  color: isCorrect ? 'var(--success)' :
                         result && !isCorrect ? 'var(--danger)' : 'var(--secondary)'
                }}>
                  {myPred.value}
                </span>
                {isCorrect && (
                  <span style={{
                    marginLeft: 'auto', fontWeight: '700',
                    color: 'var(--success)', fontSize: '13px'
                  }}>
                    ⭐+{special.points}
                  </span>
                )}
              </div>
            )}

            {/* Resultado real (si existe) */}
            {result && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px',
                background: 'rgba(212,168,67,0.1)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '10px',
                border: '1px solid rgba(212,168,67,0.3)'
              }}>
                <Trophy size={16} color="var(--secondary)" />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Resultado real:
                </span>
                <span style={{ fontSize: '20px' }}>{result.flag}</span>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--secondary)' }}>
                  {result.value}
                </span>
              </div>
            )}

            {/* Selector (si no está bloqueado) */}
            {!isLocked && (
              <>
                {special.useTeams && (
                  <>
                    <button
                      className={`btn ${myPred ? 'btn-secondary' : 'btn-primary'} btn-small`}
                      onClick={() => {
                        setShowSearch(showSearch === special.type ? null : special.type)
                        setSearchTerm('')
                      }}
                      disabled={saving === special.type}
                    >
                      {myPred ? '✏️ Cambiar selección' : '🏆 Elegir selección'}
                    </button>

                    {showSearch === special.type && (
                      <div className="animate-slide-up" style={{ marginTop: '10px' }}>
                        <input
                          className="input"
                          placeholder="🔍 Buscar selección..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                        />
                        <div style={{
                          maxHeight: '200px', overflowY: 'auto',
                          marginTop: '8px', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)'
                        }}>
                          {filteredTeams.map(team => (
                            <div
                              key={team.name}
                              onClick={() => handleSave(special.type, team.name, team.flag)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 12px',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer',
                                background: myPred?.value === team.name
                                  ? 'rgba(212,168,67,0.1)' : 'var(--bg-card)',
                                transition: 'background 0.2s'
                              }}
                            >
                              <span style={{ fontSize: '24px' }}>{team.flag}</span>
                              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                {team.name}
                              </span>
                              {myPred?.value === team.name && (
                                <Check size={16} color="var(--secondary)"
                                  style={{ marginLeft: 'auto' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Selector de goleadores */}
                {special.useScorers && (
                  <>
                    <button
                      className={`btn ${myPred ? 'btn-secondary' : 'btn-primary'} btn-small`}
                      onClick={() => {
                        setShowSearch(showSearch === special.type ? null : special.type)
                        setSearchTerm('')
                      }}
                      disabled={saving === special.type}
                    >
                      {myPred ? '✏️ Cambiar goleador' : '👟 Elegir goleador'}
                    </button>

                    {showSearch === special.type && (
                      <div className="animate-slide-up" style={{ marginTop: '10px' }}>
                        <input
                          className="input"
                          placeholder="🔍 Buscar jugador..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                        />
                        <div style={{
                          maxHeight: '250px', overflowY: 'auto',
                          marginTop: '8px', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)'
                        }}>
                          {TOP_SCORERS
                            .filter(p =>
                              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.team.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(player => (
                              <div
                                key={player.name}
                                onClick={() => handleSave(special.type, player.name, player.flag)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                  padding: '10px 12px',
                                  borderBottom: '1px solid var(--border)',
                                  cursor: 'pointer',
                                  background: myPred?.value === player.name
                                    ? 'rgba(212,168,67,0.1)' : 'var(--bg-card)',
                                  transition: 'background 0.2s'
                                }}
                              >
                                <span style={{ fontSize: '24px' }}>{player.flag}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                    {player.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {player.team}
                                  </div>
                                </div>
                                {myPred?.value === player.name && (
                                  <Check size={16} color="var(--secondary)" />
                                )}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </>
                )}

                {special.options && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '6px', marginTop: '8px'
                  }}>
                    {special.options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleSave(special.type, opt.value, opt.flag)}
                        disabled={saving === special.type}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '10px 12px',
                          background: myPred?.value === opt.value
                            ? 'rgba(212,168,67,0.15)' : 'var(--bg-dark)',
                          border: myPred?.value === opt.value
                            ? '2px solid var(--secondary)' : '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          fontSize: '12px', fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.value}</span>
                      </button>
                    ))}
                  </div>
                )}

                {special.freeText && (
                  <div style={{
                    display: 'flex', gap: '8px', marginTop: '8px'
                  }}>
                    <input
                      className="input"
                      placeholder={special.placeholder}
                      value={freeTextValues[special.type] || ''}
                      onChange={(e) => setFreeTextValues(prev => ({
                        ...prev,
                        [special.type]: e.target.value
                      }))}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary btn-small"
                      style={{ width: 'auto' }}
                      disabled={!freeTextValues[special.type] || saving === special.type}
                      onClick={() => handleSave(
                        special.type,
                        freeTextValues[special.type],
                        '⚽'
                      )}
                    >
                      ✅
                    </button>
                  </div>
                )}
              </>
            )}

            {isLocked && !myPred && (
              <div style={{
                padding: '10px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '13px'
              }}>
                🔒 No predijiste esto a tiempo
              </div>
            )}

            {/* Predicciones de todos (reveladas si está bloqueado) */}
            {isLocked && (
              <div style={{ marginTop: '12px' }}>
                <div style={{
                  fontSize: '11px', color: 'var(--text-muted)',
                  fontWeight: '700', marginBottom: '8px',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  👀 Predicciones de la familia
                </div>
                {users.map(u => {
                  const pred = allPredictions.find(
                    p => p.userId === u.id && p.type === special.type
                  )
                  const correct = result && pred &&
                    pred.value.toLowerCase() === result.value.toLowerCase()

                  return (
                    <div key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <span style={{ fontSize: '18px' }}>{u.emoji}</span>
                      <span style={{ flex: 1, fontSize: '13px' }}>{u.name}</span>
                      {pred ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                          <span>{pred.flag}</span>
                          <span style={{
                            fontWeight: '600', fontSize: '13px',
                            color: correct ? 'var(--success)' :
                                   result ? 'var(--text-muted)' : 'var(--text-primary)'
                          }}>
                            {pred.value}
                          </span>
                          {correct && <span>⭐</span>}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          No predijo
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Special