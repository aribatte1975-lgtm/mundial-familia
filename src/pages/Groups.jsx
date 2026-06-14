import { useState, useEffect } from 'react'
import { getGroupStandings, getMatches } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const GROUP_NAMES = ['A','B','C','D','E','F','G','H','I','J','K','L']

const STAGES_KNOCKOUT = [
  'Dieciseisavos',
  'Octavos de Final', 
  'Cuartos de Final',
  'Semifinal',
  'Tercer Puesto',
  'Final'
]

const Groups = () => {
  const [view, setView] = useState('groups')
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [standings, setStandings] = useState({})
  const [allGroupMatches, setAllGroupMatches] = useState([])
  const [knockoutMatches, setKnockoutMatches] = useState([])
  const [selectedStage, setSelectedStage] = useState('Dieciseisavos')
  const [loading, setLoading] = useState(true)

  useRealtime('matches', () => loadData(false))

  useEffect(() => { loadData(true) }, [])

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const [standingsData, allMatches] = await Promise.all([
      getGroupStandings(),
      getMatches()
    ])
    setStandings(standingsData.groups)
    setAllGroupMatches(standingsData.allGroupMatches)
    setKnockoutMatches(allMatches.filter(m => m.stage !== 'Fase de Grupos'))
    if (showLoading) setLoading(false)
  }

  if (loading) return (
    <div className="loading" style={{ minHeight: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  )

  const currentGroupKey = `Grupo ${selectedGroup}`
  const currentStandings = standings[currentGroupKey] || []
  const currentGroupMatches = allGroupMatches
    .filter(m => m.group === currentGroupKey)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))

  const currentKnockout = knockoutMatches
    .filter(m => m.stage === selectedStage)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>📊 Grupos y Tabla</h1>
        <p>Posiciones y resultados del Mundial 2026</p>
      </div>

      {/* Tabs principales */}
      <div className="tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`tab ${view === 'groups' ? 'active' : ''}`}
          onClick={() => setView('groups')}
        >
          📊 Fase de Grupos
        </button>
        <button
          className={`tab ${view === 'knockout' ? 'active' : ''}`}
          onClick={() => setView('knockout')}
        >
          🏆 Eliminatorias
        </button>
      </div>

      {/* ===== VISTA GRUPOS ===== */}
      {view === 'groups' && (
        <>
          {/* Selector de grupo */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px',
            marginBottom: '16px', justifyContent: 'center'
          }}>
            {GROUP_NAMES.map(g => {
              const key = `Grupo ${g}`
              const hasData = standings[key]?.some(t => t.PJ > 0)
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '50%',
                    border: selectedGroup === g
                      ? '2px solid var(--secondary)'
                      : '2px solid var(--border)',
                    background: selectedGroup === g
                      ? 'rgba(212,168,67,0.15)' : 'var(--bg-card)',
                    color: selectedGroup === g
                      ? 'var(--secondary)' : 'var(--text-primary)',
                    fontWeight: '700', fontSize: '14px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  {g}
                  {/* Punto verde si tiene partidos jugados */}
                  {hasData && (
                    <span style={{
                      position: 'absolute', top: '-2px', right: '-2px',
                      width: '8px', height: '8px',
                      background: 'var(--success)',
                      borderRadius: '50%'
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tabla de posiciones */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>
                Grupo {selectedGroup}
              </span>
              {currentStandings.length > 0 && (
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                  · {currentStandings.filter(t => t.PJ > 0).length > 0
                    ? `${currentStandings.reduce((a, t) => a + t.PJ, 0) / 2} partidos jugados`
                    : 'Sin partidos aún'}
                </span>
              )}
            </div>

            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-dark)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left',
                      color: 'var(--text-muted)', fontWeight: '600', width: '40%' }}>
                      Equipo
                    </th>
                    {['PJ','G','E','P','GF','GC','DIF','PTS'].map(col => (
                      <th key={col} style={{
                        padding: '8px 6px', textAlign: 'center',
                        color: col === 'PTS' ? 'var(--secondary)' : 'var(--text-muted)',
                        fontWeight: col === 'PTS' ? '800' : '600',
                        fontSize: col === 'PTS' ? '13px' : '11px'
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentStandings.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{
                        padding: '20px', textAlign: 'center',
                        color: 'var(--text-muted)', fontSize: '13px'
                      }}>
                        No hay equipos en este grupo aún
                      </td>
                    </tr>
                  ) : (
                    currentStandings.map((team, idx) => (
                      <tr key={team.name} style={{
                        borderBottom: '1px solid var(--border)',
                        background: idx < 2
                          ? 'rgba(16,185,129,0.04)' // top 2 clasifican
                          : idx === 2
                            ? 'rgba(212,168,67,0.04)' // 3ro puede clasificar
                            : 'transparent'
                      }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Posición */}
                            <span style={{
                              width: '20px', height: '20px',
                              borderRadius: '50%',
                              background: idx === 0 ? 'var(--success)'
                                : idx === 1 ? 'rgba(16,185,129,0.4)'
                                : idx === 2 ? 'rgba(212,168,67,0.4)'
                                : 'var(--bg-dark)',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px', fontWeight: '700',
                              color: idx < 2 ? 'white' : 'var(--text-muted)',
                              flexShrink: 0
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: '18px' }}>{team.flag}</span>
                            <span style={{
                              fontWeight: idx < 2 ? '700' : '500',
                              fontSize: '12px',
                              color: idx < 2 ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}>
                              {team.name}
                            </span>
                          </div>
                        </td>
                        {[team.PJ, team.G, team.E, team.P,
                          team.GF, team.GC, team.DIF, team.PTS].map((val, i) => (
                          <td key={i} style={{
                            padding: '10px 6px', textAlign: 'center',
                            fontWeight: i === 7 ? '800' : '500',
                            color: i === 7 ? 'var(--secondary)'
                              : i === 6
                                ? val > 0 ? 'var(--success)'
                                  : val < 0 ? 'var(--danger)'
                                  : 'var(--text-muted)'
                              : 'var(--text-secondary)',
                            fontSize: i === 7 ? '14px' : '12px'
                          }}>
                            {i === 6 && val > 0 ? `+${val}` : val}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Leyenda */}
            <div style={{
              padding: '8px 12px',
              display: 'flex', gap: '12px', flexWrap: 'wrap',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-dark)'
            }}>
              {[
                { color: 'var(--success)', label: 'Clasificado' },
                { color: 'rgba(212,168,67,0.5)', label: 'Posible clasificado' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <div style={{
                    width: '10px', height: '10px',
                    borderRadius: '2px', background: item.color
                  }} />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Partidos del grupo */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              fontWeight: '700', fontSize: '14px'
            }}>
              📅 Partidos del Grupo {selectedGroup}
            </div>

            {currentGroupMatches.length === 0 ? (
              <div style={{
                padding: '20px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '13px'
              }}>
                No hay partidos cargados para este grupo
              </div>
            ) : (
              currentGroupMatches.map((match, idx) => (
                <GroupMatchRow key={match.id} match={match} idx={idx} />
              ))
            )}
          </div>
        </>
      )}

      {/* ===== VISTA ELIMINATORIAS ===== */}
      {view === 'knockout' && (
        <>
          {/* Selector de fase */}
          <div style={{
            display: 'flex', gap: '6px', flexWrap: 'wrap',
            marginBottom: '16px', justifyContent: 'center'
          }}>
            {STAGES_KNOCKOUT.map(stage => {
              const count = knockoutMatches.filter(m => m.stage === stage).length
              const finished = knockoutMatches.filter(
                m => m.stage === stage && m.status === 'finished'
              ).length
              return (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius)',
                    border: selectedStage === stage
                      ? '2px solid var(--secondary)'
                      : '1px solid var(--border)',
                    background: selectedStage === stage
                      ? 'rgba(212,168,67,0.15)' : 'var(--bg-card)',
                    color: selectedStage === stage
                      ? 'var(--secondary)' : 'var(--text-muted)',
                    fontWeight: '600', fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {stage === 'Dieciseisavos' ? 'D16'
                    : stage === 'Octavos de Final' ? 'Octavos'
                    : stage === 'Cuartos de Final' ? 'Cuartos'
                    : stage === 'Tercer Puesto' ? '3° Puesto'
                    : stage}
                  {count > 0 && (
                    <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                      {finished}/{count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Partidos de la fase seleccionada */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              fontWeight: '700', fontSize: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'white'
            }}>
              🏆 {selectedStage}
            </div>

            {currentKnockout.length === 0 ? (
              <div style={{
                padding: '30px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '13px'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>⏳</div>
                <p>Aún no hay partidos cargados para esta fase</p>
                <p style={{ fontSize: '11px', marginTop: '4px' }}>
                  El admin los cargará cuando avance el torneo
                </p>
              </div>
            ) : (
              currentKnockout.map((match, idx) => (
                <GroupMatchRow key={match.id} match={match} idx={idx} showGroup={false} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Componente fila de partido
const GroupMatchRow = ({ match, idx, showGroup = true }) => {
  const matchDate = new Date(match.datetime)
  const dateStr = format(matchDate, "dd MMM · HH:mm", { locale: es })
  const finished = match.status === 'finished'

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
    }}>
      {/* Fecha */}
      <div style={{
        fontSize: '10px', color: 'var(--text-muted)',
        marginBottom: '6px', textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {dateStr}
        {showGroup && match.group && (
          <span style={{ marginLeft: '6px', color: 'var(--secondary)' }}>
            · {match.group}
          </span>
        )}
      </div>

      {/* Equipos y resultado */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        {/* Local */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          flex: 1, justifyContent: 'flex-end'
        }}>
          <span style={{
            fontSize: '13px', fontWeight: finished ? '700' : '500',
            color: finished && match.homeScore > match.awayScore
              ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'right'
          }}>
            {match.homeTeam}
          </span>
          <span style={{ fontSize: '20px' }}>{match.homeFlag}</span>
        </div>

        {/* Resultado o VS */}
        <div style={{
          minWidth: '60px', textAlign: 'center',
          background: finished ? 'var(--bg-dark)' : 'rgba(255,255,255,0.05)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 8px',
          border: finished ? '1px solid var(--border)' : '1px dashed var(--border)'
        }}>
          {finished ? (
            <span style={{
              fontSize: '16px', fontWeight: '800',
              color: 'var(--text-primary)'
            }}>
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              VS
            </span>
          )}
        </div>

        {/* Visitante */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          flex: 1, justifyContent: 'flex-start'
        }}>
          <span style={{ fontSize: '20px' }}>{match.awayFlag}</span>
          <span style={{
            fontSize: '13px', fontWeight: finished ? '700' : '500',
            color: finished && match.awayScore > match.homeScore
              ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}>
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Badge resultado */}
      {finished && (
        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <span style={{
            fontSize: '10px', fontWeight: '700',
            color: match.homeScore === match.awayScore
              ? 'var(--warning)'
              : 'var(--success)',
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            {match.homeScore === match.awayScore ? '🤝 Empate'
              : match.homeScore > match.awayScore
                ? `✅ Gana ${match.homeTeam}`
                : `✅ Gana ${match.awayTeam}`}
          </span>
        </div>
      )}
    </div>
  )
}

export default Groups