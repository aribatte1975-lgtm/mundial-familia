import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getMatches, addMatch, updateMatch, deleteMatch,
  getUsers, updateUser, getSettings, updateSettings,
  loadWorldCupMatches, resetAllData, getClassifiedTeams, generateKnockoutMatches 
} from '../lib/supabase'
import { Plus, Trash2, Save, Settings, Users, Calendar, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TEAMS } from '../data/teams'

const STAGES = [
  'Fase de Grupos',
  'Dieciseisavos',
  'Octavos de Final',
  'Cuartos de Final',
  'Semifinal',
  'Tercer Puesto',
  'Final'
]

const Admin = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('matches')
  const [matches, setMatches] = useState([])
  const [users, setUsers] = useState([])
  const [settings, setSettings] = useState({})
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [toast, setToast] = useState(null)
  const [stageFilter, setStageFilter] = useState('all')

  const [newMatch, setNewMatch] = useState({
    homeTeam: '', homeFlag: '', awayTeam: '', awayFlag: '',
    group: 'Grupo A', stage: 'Fase de Grupos', datetime: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
  const [m, u, s] = await Promise.all([getMatches(), getUsers(), getSettings()])
  setMatches(m)
  setUsers(u)
  setSettings(s)
}

  const showToastMsg = (msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAddMatch = async () => {
  if (!newMatch.homeTeam || !newMatch.awayTeam || !newMatch.datetime) {
    showToastMsg('Completa todos los campos', 'error')
    return
  }
  await addMatch(newMatch)
  setNewMatch({ homeTeam: '', homeFlag: '', awayTeam: '', awayFlag: '', group: 'Grupo A', stage: 'Fase de Grupos', datetime: '' })
  setShowAddMatch(false)
  await loadData()
  showToastMsg('¡Partido agregado! ⚽')
}

  const handleSelectCountry = (field, country) => {
    if (field === 'home') {
      setNewMatch({ ...newMatch, homeTeam: country.name, homeFlag: country.flag })
    } else {
      setNewMatch({ ...newMatch, awayTeam: country.name, awayFlag: country.flag })
    }
  }

  const handleUpdateScore = async (matchId, homeScore, awayScore, penaltyData = null) => {
  const updates = {
    homeScore: parseInt(homeScore),
    awayScore: parseInt(awayScore),
    status: 'finished'
  }

  if (penaltyData) {
    updates.isPenalty = penaltyData.isPenalty
    updates.penaltyWinner = penaltyData.penaltyWinner
    updates.penaltyHome = penaltyData.penaltyHome
    updates.penaltyAway = penaltyData.penaltyAway
  }

  await updateMatch(matchId, updates)
  await loadData()
  showToastMsg(penaltyData?.isPenalty
    ? '¡Resultado con penales actualizado! ⚽'
    : '¡Resultado actualizado! ✅'
  )
}

  const handleDeleteMatch = async (matchId) => {
  if (confirm('¿Eliminar este partido?')) {
    await deleteMatch(matchId)
    await loadData()
    showToastMsg('Partido eliminado')
  }
}

  const handleResetMatch = async (matchId) => {
  await updateMatch(matchId, { homeScore: null, awayScore: null, status: 'upcoming' })
  await loadData()
  showToastMsg('Partido reseteado')
}

const handleUpdateUser = async (userId, field, value) => {
  await updateUser(userId, { [field]: value })
  await loadData()
}

  // Filtrar partidos por fase
  const filteredMatches = stageFilter === 'all' 
    ? matches 
    : matches.filter(m => m.stage === stageFilter)

  // Contar partidos por estado
  const finishedCount = matches.filter(m => m.status === 'finished').length
  const upcomingCount = matches.filter(m => m.status === 'upcoming').length

  if (!user.isAdmin) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <p>Solo el administrador puede acceder aquí</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <div className="page-header">
        <h1>⚙️ Administración</h1>
        <p>{matches.length} partidos · {finishedCount} finalizados · {upcomingCount} pendientes</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>
          <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Partidos
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Familia
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Config
        </button>
        <button className={`tab ${activeTab === 'knockout' ? 'active' : ''}`} 
          onClick={() => setActiveTab('knockout')}>
          <Trophy size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> D16
        </button>
      </div>

      {/* ===== TAB PARTIDOS ===== */}
      {activeTab === 'matches' && (
        <>
          <button
            className="btn btn-primary mb-1"
            onClick={() => setShowAddMatch(!showAddMatch)}
          >
            <Plus size={18} />
            {showAddMatch ? 'Cancelar' : 'Agregar Partido'}
          </button>

          {showAddMatch && (
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Nuevo Partido</h3>

              <div className="input-group">
                <label>Fase</label>
                <select className="input" value={newMatch.stage}
                  onChange={(e) => setNewMatch({ ...newMatch, stage: e.target.value })}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {newMatch.stage === 'Fase de Grupos' && (
                <div className="input-group">
                  <label>Grupo</label>
                  <select className="input" value={newMatch.group}
                    onChange={(e) => setNewMatch({ ...newMatch, group: e.target.value })}>
                    {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => (
                      <option key={g} value={`Grupo ${g}`}>Grupo {g}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label>Equipo Local</label>
                <select className="input" value={newMatch.homeTeam}
                  onChange={(e) => {
                      const c = TEAMS.find(c => c.name === e.target.value)
                      if (c) handleSelectCountry('home', c)
                    }}>
                    <option value="">Seleccionar...</option>
                    {TEAMS.map(c => (
                      <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Equipo Visitante</label>
                <select className="input" value={newMatch.awayTeam}
                  onChange={(e) => {
                    const c = TEAMS.find(c => c.name === e.target.value)
                    if (c) handleSelectCountry('away', c)
                  }}>
                  <option value="">Seleccionar...</option>
                  {TEAMS.map(c => (
                    <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Fecha y hora</label>
                <input type="datetime-local" className="input" value={newMatch.datetime}
                  onChange={(e) => setNewMatch({ ...newMatch, datetime: new Date(e.target.value).toISOString() })} />
              </div>

              {newMatch.homeTeam && newMatch.awayTeam && (
                <div style={{ textAlign: 'center', margin: '12px 0', fontSize: '20px' }}>
                  {newMatch.homeFlag} {newMatch.homeTeam} vs {newMatch.awayTeam} {newMatch.awayFlag}
                </div>
              )}

              <button className="btn btn-success" onClick={handleAddMatch}>
                <Save size={18} /> Guardar Partido
              </button>
            </div>
          )}

          {/* Filtro por fase */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', marginTop: '8px' }}>
  {[
    { key: 'all', label: 'Todos' },
    { key: 'Fase de Grupos', label: 'Grupos' },
    { key: 'Dieciseisavos', label: 'D16' },
    { key: 'Octavos de Final', label: 'Octavos' },
    { key: 'Cuartos de Final', label: 'Cuartos' },
    { key: 'Semifinal', label: 'Semis' },
    { key: 'Tercer Puesto', label: '3° Puesto' },
    { key: 'Final', label: 'Final' },
  ].map(f => (
    <button
      key={f.key}
      className={`btn btn-small ${stageFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
      style={{ width: 'auto' }}
      onClick={() => setStageFilter(f.key)}
    >
      {f.label} ({f.key === 'all' ? matches.length : matches.filter(m => m.stage === f.key).length})
    </button>
  ))}
</div>


          {/* Lista de partidos */}
          <h3 className="section-title">
            {stageFilter === 'all' ? 'Todos los partidos' : stageFilter} ({filteredMatches.length})
          </h3>
          
          {filteredMatches.map(match => (
            <MatchResultAdmin
              key={match.id}
              match={match}
              onUpdateScore={handleUpdateScore}
              onDelete={handleDeleteMatch}
              onReset={handleResetMatch}
            />
          ))}
        </>
      )}

      {/* ===== TAB FAMILIA ===== */}
      {activeTab === 'users' && (
        <>
          {users.map(u => (
            <div key={u.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '36px' }}>{u.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div className="input-group" style={{ marginBottom: '8px' }}>
                    <label>Nombre</label>
                    <input className="input" value={u.name}
                      onChange={(e) => handleUpdateUser(u.id, 'name', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ marginBottom: '8px' }}>
                    <label>Emoji</label>
                    <input className="input" value={u.emoji}
                      onChange={(e) => handleUpdateUser(u.id, 'emoji', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>PIN</label>
                    <input className="input" type="text" inputMode="numeric" maxLength={4}
                      value={u.pin}
                      onChange={(e) => handleUpdateUser(u.id, 'pin', e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ===== TAB CONFIGURACIÓN ===== */}
      {activeTab === 'settings' && (
        <div>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Sistema de Puntos</h3>
            
            <div className="input-group">
              <label>⭐ Puntos por resultado exacto</label>
              <input type="number" className="input" value={settings.pointsExact || 5}
                onChange={(e) => { updateSettings({ pointsExact: parseInt(e.target.value) }); loadData() }} />
            </div>
            <div className="input-group">
              <label>✅ Puntos por acertar ganador</label>
              <input type="number" className="input" value={settings.pointsCorrect || 3}
                onChange={(e) => { updateSettings({ pointsCorrect: parseInt(e.target.value) }); loadData() }} />
            </div>
            <div className="input-group">
              <label>🔥 Puntos bonus por racha</label>
              <input type="number" className="input" value={settings.pointsBonus || 2}
                onChange={(e) => { updateSettings({ pointsBonus: parseInt(e.target.value) }); loadData() }} />
            </div>
            <div className="input-group">
              <label>🔥 Racha necesaria para bonus</label>
              <input type="number" className="input" value={settings.bonusStreak || 3}
                onChange={(e) => { updateSettings({ bonusStreak: parseInt(e.target.value) }); loadData() }} />
            </div>
          </div>

          <div className="card mt-2" style={{ borderColor: 'var(--warning)' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--warning)' }}>🏆 Datos del Mundial</h3>
            
            <button className="btn btn-primary mb-1"
              onClick={() => {
                if (confirm('⚠️ ¿Cargar/Recargar TODOS los partidos del Mundial 2026?\n\nEsto borrará partidos existentes y predicciones.')) {
                  loadWorldCupMatches()
                  loadData()
                  showToastMsg('¡Mundial 2026 cargado! 🏆 ' + getMatches().length + ' partidos')
                }
              }}>
              🏆 Cargar Mundial 2026 Completo
            </button>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Carga los 104 partidos con horarios en hora española
            </p>
          </div>

          <div className="card mt-2" style={{ borderColor: 'var(--danger)' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--danger)' }}>⚠️ Zona peligrosa</h3>
            <button className="btn btn-small"
              style={{ background: 'var(--danger)', color: 'white' }}
              onClick={() => {
                if (confirm('⚠️ ¿BORRAR ABSOLUTAMENTE TODO?\n\nPartidos, predicciones, configuración...\nEsto NO se puede deshacer.')) {
                  resetAllData()
                  window.location.reload()
                }
              }}>
              <Trash2 size={14} /> Borrar TODO y empezar de cero
            </button>
          </div>
        </div>
      )}
      
      {/* ===== TAB ELIMINATORIAS ===== */}
      {activeTab === 'knockout' && (
        <KnockoutTab
          onToast={showToastMsg}
          onReload={loadData}
        />
      )}
    </div>
  )
}

// Componente para gestionar resultado de cada partido
const MatchResultAdmin = ({ match, onUpdateScore, onDelete, onReset }) => {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? '')
  const [awayScore, setAwayScore] = useState(match.awayScore ?? '')
  const [expanded, setExpanded] = useState(false)
  
  // Penales
  const [isPenalty, setIsPenalty] = useState(match.isPenalty || false)
  const [penaltyWinner, setPenaltyWinner] = useState(match.penaltyWinner || null)
  const [penaltyHome, setPenaltyHome] = useState(match.penaltyHome ?? '')
  const [penaltyAway, setPenaltyAway] = useState(match.penaltyAway ?? '')

  const isKnockout = ['Dieciseisavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final'].includes(match.stage)
  const isDraw = homeScore !== '' && awayScore !== '' && parseInt(homeScore) === parseInt(awayScore)

  const matchDate = new Date(match.datetime)
  const dateStr = format(matchDate, "dd/MM HH:mm", { locale: es })

  const handleSave = () => {
    const penaltyData = isKnockout && isDraw && isPenalty ? {
      isPenalty: true,
      penaltyWinner,
      penaltyHome: parseInt(penaltyHome),
      penaltyAway: parseInt(penaltyAway)
    } : {
      isPenalty: false,
      penaltyWinner: null,
      penaltyHome: null,
      penaltyAway: null
    }

    onUpdateScore(match.id, homeScore, awayScore, penaltyData)
  }

  return (
    <div className="admin-match-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: '14px' }}>{match.homeFlag}</span>
        <span style={{ fontSize: '11px', flex: 1, lineHeight: '1.3' }}>
          <strong>{match.homeTeam}</strong> vs <strong>{match.awayTeam}</strong>
          <br />
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
            {dateStr} · {match.group}
          </span>
        </span>
        <span style={{ fontSize: '14px' }}>{match.awayFlag}</span>
        <span className={`match-status ${match.status}`} style={{ fontSize: '9px' }}>
          {match.status === 'finished' 
            ? `${match.homeScore}-${match.awayScore}${match.isPenalty ? ' (pen)' : ''}` 
            : '⏳'}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {expanded && (
        <div className="animate-slide-up" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
            📍 {match.venue || 'Sede por confirmar'}
          </p>

          {/* Resultado 90 min */}
          {isKnockout && (
            <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Resultado en 90 minutos
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', maxWidth: '80px', textAlign: 'right' }}>{match.homeTeam}</span>
            <input type="number" className="admin-score-input" value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)} min="0" />
            <span style={{ fontWeight: '700' }}>-</span>
            <input type="number" className="admin-score-input" value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)} min="0" />
            <span style={{ fontSize: '12px', maxWidth: '80px' }}>{match.awayTeam}</span>
          </div>

          {/* Sección penales - solo eliminatorias y empate */}
          {isKnockout && isDraw && (
            <div className="animate-slide-up" style={{
              marginTop: '12px', padding: '12px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '12px', fontWeight: '700', color: 'var(--warning)',
                cursor: 'pointer', marginBottom: '10px'
              }}>
                <input
                  type="checkbox"
                  checked={isPenalty}
                  onChange={(e) => setIsPenalty(e.target.checked)}
                />
                ⚽ ¿Se definió por penales?
              </label>

              {isPenalty && (
                <div className="animate-fade-in">
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    ¿Quién clasificó?
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <button
                      onClick={() => setPenaltyWinner(match.homeTeam)}
                      style={{
                        flex: 1, padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: penaltyWinner === match.homeTeam
                          ? '2px solid var(--success)' : '1px solid var(--border)',
                        background: penaltyWinner === match.homeTeam
                          ? 'rgba(16,185,129,0.1)' : 'var(--bg-dark)',
                        cursor: 'pointer', textAlign: 'center',
                        fontSize: '11px', fontWeight: '600',
                        color: penaltyWinner === match.homeTeam
                          ? 'var(--success)' : 'var(--text-secondary)'
                      }}
                    >
                      {match.homeFlag} {match.homeTeam}
                    </button>
                    <button
                      onClick={() => setPenaltyWinner(match.awayTeam)}
                      style={{
                        flex: 1, padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: penaltyWinner === match.awayTeam
                          ? '2px solid var(--success)' : '1px solid var(--border)',
                        background: penaltyWinner === match.awayTeam
                          ? 'rgba(16,185,129,0.1)' : 'var(--bg-dark)',
                        cursor: 'pointer', textAlign: 'center',
                        fontSize: '11px', fontWeight: '600',
                        color: penaltyWinner === match.awayTeam
                          ? 'var(--success)' : 'var(--text-secondary)'
                      }}
                    >
                      {match.awayFlag} {match.awayTeam}
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Resultado penales:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <input type="number" className="admin-score-input" value={penaltyHome}
                      onChange={(e) => setPenaltyHome(e.target.value)} min="0"
                      style={{ width: '45px' }} />
                    <span style={{ fontWeight: '700', color: 'var(--warning)' }}>-</span>
                    <input type="number" className="admin-score-input" value={penaltyAway}
                      onChange={(e) => setPenaltyAway(e.target.value)} min="0"
                      style={{ width: '45px' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-success btn-small" style={{ flex: 1 }}
              onClick={handleSave}
              disabled={homeScore === '' || awayScore === '' || 
                (isKnockout && isDraw && isPenalty && !penaltyWinner)}>
              <Save size={14} /> Resultado
            </button>
            {match.status === 'finished' && (
              <button className="btn btn-secondary btn-small" onClick={() => onReset(match.id)}>↩️</button>
            )}
            <button className="btn btn-small" style={{ background: 'var(--danger)', color: 'white', width: 'auto' }}
              onClick={() => onDelete(match.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== COMPONENTE TAB ELIMINATORIAS =====
const KnockoutTab = ({ onToast, onReload }) => {
  const [classified, setClassified] = useState(null)
  const [selectedThirds, setSelectedThirds] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [step, setStep] = useState(1) // 1: ver clasificados, 2: elegir terceros, 3: confirmar

  useEffect(() => { loadClassified() }, [])

  const loadClassified = async () => {
    setLoading(true)
    const data = await getClassifiedTeams()
    setClassified(data)
    setLoading(false)
  }

  const toggleThird = (letter) => {
    if (selectedThirds.includes(letter)) {
      setSelectedThirds(prev => prev.filter(l => l !== letter))
    } else {
      if (selectedThirds.length >= 8) {
        onToast('Solo pueden clasificar 8 terceros', 'error')
        return
      }
      setSelectedThirds(prev => [...prev, letter])
    }
  }

  const handleGenerate = async () => {
    if (selectedThirds.length !== 8) {
      onToast('Debes seleccionar exactamente 8 terceros', 'error')
      return
    }

    if (!confirm(`¿Generar los 16 partidos de Dieciseisavos?\n\nTerceros clasificados: Grupos ${selectedThirds.sort().join(', ')}\n\nEsto creará 16 partidos nuevos.`)) return

    setGenerating(true)
    const results = await generateKnockoutMatches(selectedThirds, {})
    setGenerating(false)

    const errors = results.filter(r => r.error || !r.success)

      if (errors.length > 0) {
        onToast(`⚠️ ${errors.length} partidos con error`, 'error')
        console.error('Errores al generar D16:', errors)
      } else {
        onToast('¡16 partidos de Dieciseisavos generados! 🏆', 'success')
        onReload()
    }
  }

  if (loading) return (
    <div className="loading" style={{ minHeight: '200px' }}>
      <div className="loading-spinner" />
    </div>
  )

  const groupLetters = ['A','B','C','D','E','F','G','H','I','J','K','L']

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(212,168,67,0.1), rgba(139,21,56,0.1))',
        borderColor: 'rgba(212,168,67,0.3)',
        marginBottom: '16px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
          🏆 Generador de Dieciseisavos
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Seleccioná los 8 mejores terceros y generá los 16 cruces automáticamente
        </p>
      </div>

      {/* Paso 1: Clasificados por grupo */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h4 style={{ 
          fontSize: '13px', fontWeight: '700', 
          marginBottom: '12px', color: 'var(--text-secondary)' 
        }}>
          📊 Clasificados por Grupo
        </h4>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-dark)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-muted)' }}>Grupo</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--success)' }}>1° Clasificado</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--success)' }}>2° Clasificado</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--warning)' }}>3° (posible)</th>
              </tr>
            </thead>
            <tbody>
              {groupLetters.map(letter => {
                const first = classified.firsts[letter]
                const second = classified.seconds[letter]
                const third = classified.thirds.find(t => t.groupLetter === letter)
                
                return (
                  <tr key={letter} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px', fontWeight: '800', color: 'var(--secondary)' }}>
                      {letter}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {first ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{first.flag}</span>
                          <span style={{ fontSize: '11px' }}>{first.name}</span>
                          <span style={{ 
                            fontSize: '9px', color: 'var(--secondary)', 
                            fontWeight: '700', marginLeft: '2px' 
                          }}>
                            {first.PTS}pts
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {second ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{second.flag}</span>
                          <span style={{ fontSize: '11px' }}>{second.name}</span>
                          <span style={{ 
                            fontSize: '9px', color: 'var(--secondary)', 
                            fontWeight: '700', marginLeft: '2px' 
                          }}>
                            {second.PTS}pts
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {third ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{third.flag}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {third.name}
                          </span>
                          <span style={{ 
                            fontSize: '9px', color: 'var(--warning)', 
                            fontWeight: '700', marginLeft: '2px' 
                          }}>
                            {third.PTS}pts
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paso 2: Elegir 8 mejores terceros */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h4 style={{ 
          fontSize: '13px', fontWeight: '700', 
          marginBottom: '4px', color: 'var(--text-secondary)' 
        }}>
          🏅 Elegir 8 Mejores Terceros
          <span style={{ 
            marginLeft: '8px', fontSize: '11px',
            color: selectedThirds.length === 8 ? 'var(--success)' : 'var(--warning)',
            fontWeight: '700'
          }}>
            ({selectedThirds.length}/8)
          </span>
        </h4>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Están ordenados por puntos. Seleccioná los 8 que clasificaron.
        </p>

        {classified.thirds.map((team, idx) => (
          <div
            key={team.groupLetter}
            onClick={() => toggleThird(team.groupLetter)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px',
              marginBottom: '6px',
              borderRadius: 'var(--radius-sm)',
              border: selectedThirds.includes(team.groupLetter)
                ? '2px solid var(--success)' : '1px solid var(--border)',
              background: selectedThirds.includes(team.groupLetter)
                ? 'rgba(16,185,129,0.08)' : 'var(--bg-dark)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {/* Posición entre los terceros */}
            <span style={{ 
              fontSize: '11px', fontWeight: '700', width: '20px',
              color: idx < 8 ? 'var(--success)' : 'var(--text-muted)'
            }}>
              {idx + 1}°
            </span>

            {/* Equipo */}
            <span style={{ fontSize: '20px' }}>{team.flag}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: '600' }}>{team.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Grupo {team.groupLetter} · {team.PTS}pts · DIF {team.DIF > 0 ? '+' : ''}{team.DIF} · {team.GF} GF
              </div>
            </div>

            {/* Check */}
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              border: selectedThirds.includes(team.groupLetter)
                ? 'none' : '2px solid var(--border)',
              background: selectedThirds.includes(team.groupLetter)
                ? 'var(--success)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {selectedThirds.includes(team.groupLetter) && (
                <span style={{ fontSize: '12px', color: 'white' }}>✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Paso 3: Preview de cruces */}
      {selectedThirds.length === 8 && (
        <div className="card animate-slide-up" style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            fontSize: '13px', fontWeight: '700', 
            marginBottom: '12px', color: 'var(--success)' 
          }}>
            ✅ Vista previa de cruces
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Las fechas exactas las podrás editar desde la tab Partidos después de generar.
          </p>

          {[
            { num: 49, h: classified.firsts['A'], a: classified.seconds['B'] },
            { num: 55, h: classified.seconds['A'], a: classified.seconds['C'] },
            { num: 52, h: classified.firsts['D'], a: classified.seconds['E'] },
            { num: 53, h: classified.firsts['E'], a: classified.seconds['D'] },
            { num: 56, h: classified.firsts['G'], a: classified.seconds['H'] },
            { num: 57, h: classified.firsts['H'], a: classified.seconds['G'] },
            { num: 59, h: classified.firsts['J'], a: classified.seconds['K'] },
            { num: 62, h: classified.seconds['I'], a: classified.seconds['L'] },
          ].map(({ num, h, a }) => (
            <div key={num} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 0', borderBottom: '1px solid var(--border)',
              fontSize: '12px'
            }}>
              <span style={{ 
                fontSize: '10px', color: 'var(--text-muted)', 
                width: '30px', fontWeight: '700' 
              }}>
                P{num}
              </span>
              {h ? (
                <>
                  <span>{h.flag}</span>
                  <span style={{ flex: 1, fontWeight: '600' }}>{h.name}</span>
                </>
              ) : <span style={{ flex: 1, color: 'var(--text-muted)' }}>Por definir</span>}
              <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>vs</span>
              {a ? (
                <>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: '600' }}>{a.name}</span>
                  <span>{a.flag}</span>
                </>
              ) : <span style={{ flex: 1, color: 'var(--text-muted)' }}>Por definir</span>}
            </div>
          ))}
        </div>
      )}

      {/* Botón generar */}
      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={selectedThirds.length !== 8 || generating}
        style={{
          opacity: selectedThirds.length !== 8 ? 0.5 : 1,
          background: selectedThirds.length === 8 
            ? 'linear-gradient(135deg, var(--secondary), var(--secondary-dark))'
            : undefined,
          color: selectedThirds.length === 8 ? 'var(--bg-dark)' : 'white',
          fontWeight: '800'
        }}
      >
        {generating ? (
          '⏳ Generando partidos...'
        ) : selectedThirds.length === 8 ? (
          '🚀 Generar 16 partidos de Dieciseisavos'
        ) : (
          `Seleccioná ${8 - selectedThirds.length} tercero${8 - selectedThirds.length !== 1 ? 's' : ''} más`
        )}
      </button>
    </div>
  )
}

export default Admin