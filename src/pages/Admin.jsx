import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getMatches, addMatch, updateMatch, deleteMatch,
  getUsers, updateUser, getSettings, updateSettings,
  loadWorldCupMatches, resetAllData 
} from '../lib/supabase'
import { Plus, Trash2, Save, Settings, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
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

  const handleUpdateScore = async (matchId, homeScore, awayScore) => {
  await updateMatch(matchId, {
    homeScore: parseInt(homeScore),
    awayScore: parseInt(awayScore),
    status: 'finished'
  })
  await loadData()
  showToastMsg('¡Resultado actualizado! ✅')
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
    </div>
  )
}

// Componente para gestionar resultado de cada partido
const MatchResultAdmin = ({ match, onUpdateScore, onDelete, onReset }) => {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? '')
  const [awayScore, setAwayScore] = useState(match.awayScore ?? '')
  const [expanded, setExpanded] = useState(false)

  const matchDate = new Date(match.datetime)
  const dateStr = format(matchDate, "dd/MM HH:mm", { locale: es })

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
          {match.status === 'finished' ? `${match.homeScore}-${match.awayScore}` : '⏳'}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {expanded && (
        <div className="animate-slide-up" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
            📍 {match.venue || 'Sede por confirmar'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', maxWidth: '80px', textAlign: 'right' }}>{match.homeTeam}</span>
            <input type="number" className="admin-score-input" value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)} min="0" />
            <span style={{ fontWeight: '700' }}>-</span>
            <input type="number" className="admin-score-input" value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)} min="0" />
            <span style={{ fontSize: '12px', maxWidth: '80px' }}>{match.awayTeam}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-success btn-small" style={{ flex: 1 }}
              onClick={() => onUpdateScore(match.id, homeScore, awayScore)}
              disabled={homeScore === '' || awayScore === ''}>
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

export default Admin