import { createClient } from '@supabase/supabase-js'

// ===== CLIENTE SUPABASE =====
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================
// USUARIOS
// =============================================

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('id')
  if (error) { console.error('getUsers:', error); return [] }
  return data.map(u => ({
    id: u.id,
    name: u.name,
    emoji: u.emoji,
    pin: u.pin,
    isAdmin: u.is_admin
  }))
}

export const getUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  if (error) { console.error('getUserById:', error); return null }
  return { id: data.id, name: data.name, emoji: data.emoji, pin: data.pin, isAdmin: data.is_admin }
}

export const loginUser = async (userId, pin) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('pin', pin)
    .single()
  if (error) return null
  return { id: data.id, name: data.name, emoji: data.emoji, pin: data.pin, isAdmin: data.is_admin }
}

export const updateUser = async (userId, updates) => {
  const dbUpdates = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji
  if (updates.pin !== undefined) dbUpdates.pin = updates.pin
  if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single()
  if (error) { console.error('updateUser:', error); return null }
  return { id: data.id, name: data.name, emoji: data.emoji, pin: data.pin, isAdmin: data.is_admin }
}

// =============================================
// PARTIDOS
// =============================================

export const getMatches = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('datetime')
  if (error) { console.error('getMatches:', error); return [] }
  return data.map(m => ({
    id: m.id,
    homeTeam: m.home_team,
    homeFlag: m.home_flag,
    awayTeam: m.away_team,
    awayFlag: m.away_flag,
    group: m.match_group,
    stage: m.stage,
    datetime: m.datetime,
    venue: m.venue,
    homeScore: m.home_score,
    awayScore: m.away_score,
    status: m.status
  }))
}

export const getMatchById = async (id) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return {
    id: data.id, homeTeam: data.home_team, homeFlag: data.home_flag,
    awayTeam: data.away_team, awayFlag: data.away_flag,
    group: data.match_group, stage: data.stage, datetime: data.datetime,
    venue: data.venue, homeScore: data.home_score, awayScore: data.away_score, status: data.status
  }
}

export const addMatch = async (match) => {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      home_team: match.homeTeam,
      home_flag: match.homeFlag || '🏳️',
      away_team: match.awayTeam,
      away_flag: match.awayFlag || '🏳️',
      match_group: match.group,
      stage: match.stage,
      datetime: match.datetime,
      venue: match.venue || '',
      status: 'upcoming'
    })
    .select()
    .single()
  if (error) { console.error('addMatch:', error); return null }
  return data
}

export const updateMatch = async (matchId, updates) => {
  const dbUpdates = {}
  if (updates.homeTeam !== undefined) dbUpdates.home_team = updates.homeTeam
  if (updates.homeFlag !== undefined) dbUpdates.home_flag = updates.homeFlag
  if (updates.awayTeam !== undefined) dbUpdates.away_team = updates.awayTeam
  if (updates.awayFlag !== undefined) dbUpdates.away_flag = updates.awayFlag
  if (updates.homeScore !== undefined) dbUpdates.home_score = updates.homeScore
  if (updates.awayScore !== undefined) dbUpdates.away_score = updates.awayScore
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.venue !== undefined) dbUpdates.venue = updates.venue
  if (updates.datetime !== undefined) dbUpdates.datetime = updates.datetime

  const { data, error } = await supabase
    .from('matches')
    .update(dbUpdates)
    .eq('id', matchId)
    .select()
    .single()
  if (error) { console.error('updateMatch:', error); return null }
  return {
    id: data.id, homeTeam: data.home_team, homeFlag: data.home_flag,
    awayTeam: data.away_team, awayFlag: data.away_flag,
    group: data.match_group, stage: data.stage, datetime: data.datetime,
    venue: data.venue, homeScore: data.home_score, awayScore: data.away_score, status: data.status
  }
}

export const deleteMatch = async (matchId) => {
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)
  if (error) console.error('deleteMatch:', error)
}

// =============================================
// PREDICCIONES
// =============================================

export const getPredictions = async () => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
  if (error) { console.error('getPredictions:', error); return [] }
  return data.map(p => ({
    id: p.id, userId: p.user_id, matchId: p.match_id,
    homeScore: p.home_score, awayScore: p.away_score,
    isWildcard: p.is_wildcard || false,
    createdAt: p.created_at
  }))
}

export const getPredictionsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
  if (error) { console.error('getPredictionsByUser:', error); return [] }
  return data.map(p => ({
    id: p.id,
    userId: p.user_id,
    matchId: p.match_id,
    homeScore: p.home_score,
    awayScore: p.away_score,
    isWildcard: p.is_wildcard || false
  }))
}

export const getPredictionsByMatch = async (matchId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)
  if (error) { console.error('getPredictionsByMatch:', error); return [] }
  return data.map(p => ({
    id: p.id,
    userId: p.user_id,
    matchId: p.match_id,
    homeScore: p.home_score,
    awayScore: p.away_score,
    isWildcard: p.is_wildcard || false
  }))
}

export const getPrediction = async (userId, matchId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle()
  if (error) { console.error('getPrediction:', error); return null }
  if (!data) return null
  return {
    id: data.id, userId: data.user_id, matchId: data.match_id,
    homeScore: data.home_score, awayScore: data.away_score,
    isWildcard: data.is_wildcard || false
  }
}

export const savePrediction = async (userId, matchId, homeScore, awayScore, isWildcard = false) => {
  // Verificar que el partido no haya comenzado
  const match = await getMatchById(matchId)
  if (match && new Date(match.datetime) <= new Date()) {
    return { error: '¡El partido ya comenzó! No puedes predecir.' }
  }

  // Si quiere usar comodín, verificar que tenga disponibles
  if (isWildcard) {
    const used = await getWildcardsUsed(userId)
    // Verificar si ya tenía comodín en este partido (no contar doble)
    const existingPred = await getPrediction(userId, matchId)
    const alreadyWildcard = existingPred?.isWildcard || false
    
    if (used >= 3 && !alreadyWildcard) {
      return { error: '¡Ya usaste tus 3 comodines! 🃏' }
    }
  }

  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: userId,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      is_wildcard: isWildcard,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,match_id'
    })

  if (error) { console.error('savePrediction:', error); return { error: error.message } }
  return { success: true }
}

// =============================================
// CALCULAR PUNTOS (lógica pura, sin BD)
// =============================================

export const calculatePoints = (prediction, match, settings) => {
  if (match.status !== 'finished' || match.homeScore === null) return null

  const s = settings || { pointsExact: 5, pointsCorrect: 3 }
  const multiplier = prediction.isWildcard ? 2 : 1

  if (prediction.homeScore === match.homeScore &&
      prediction.awayScore === match.awayScore) {
    return { 
      points: s.pointsExact * multiplier, 
      type: 'exact', 
      isWildcard: prediction.isWildcard,
      basePoints: s.pointsExact
    }
  }

  const predResult = prediction.homeScore > prediction.awayScore ? 'home'
    : prediction.homeScore < prediction.awayScore ? 'away' : 'draw'
  const matchResult = match.homeScore > match.awayScore ? 'home'
    : match.homeScore < match.awayScore ? 'away' : 'draw'

  if (predResult === matchResult) {
    return { 
      points: s.pointsCorrect * multiplier, 
      type: 'correct',
      isWildcard: prediction.isWildcard,
      basePoints: s.pointsCorrect
    }
  }

  return { 
    points: 0, 
    type: 'wrong',
    isWildcard: prediction.isWildcard,
    basePoints: 0
  }
}

// =============================================
// RANKING
// =============================================

export const getRanking = async () => {
  const [users, matches, predictions, settings, specialPreds, specialResults] = await Promise.all([
    getUsers(),
    getMatches(),
    getPredictions(),
    getSettings(),
    getSpecialPredictions(),
    getSpecialResults()
  ])

  const finished = matches.filter(m => m.status === 'finished')

  return users.map(user => {
    let totalPoints = 0
    let exactPredictions = 0
    let correctPredictions = 0
    let wrongPredictions = 0
    let bestStreak = 0
    let tempStreak = 0
    let currentStreak = 0

    predictions
      .filter(p => p.userId === user.id)
      .sort((a, b) => {
        const ma = matches.find(m => m.id === a.matchId)
        const mb = matches.find(m => m.id === b.matchId)
        return new Date(ma?.datetime || 0) - new Date(mb?.datetime || 0)
      })
      .forEach(pred => {
        const match = finished.find(m => m.id === pred.matchId)
        if (!match) return
        const result = calculatePoints(pred, match, settings)
        if (!result) return
        totalPoints += result.points
        if (result.type === 'exact') { exactPredictions++; tempStreak++ }
        else if (result.type === 'correct') { correctPredictions++; tempStreak++ }
        else { wrongPredictions++; tempStreak = 0 }
        if (tempStreak > bestStreak) bestStreak = tempStreak
        currentStreak = tempStreak
      })

    // Bonus racha
    const bonusPoints = Math.floor(bestStreak / settings.bonusStreak) * settings.pointsBonus
    totalPoints += bonusPoints

    // Puntos especiales (campeón, goleador, etc.)
    let specialPoints = 0
    const userSpecialPreds = specialPreds.filter(p => p.userId === user.id)
    userSpecialPreds.forEach(pred => {
      const result = specialResults.find(r => r.type === pred.type)
      if (result && pred.value.toLowerCase() === result.value.toLowerCase()) {
        specialPoints += result.points
      }
    })
    totalPoints += specialPoints

  const wildcardsUsed = predictions
  .filter(p => p.userId === user.id && p.isWildcard)
  .length

  return {
    ...user, totalPoints, exactPredictions, correctPredictions,
    wrongPredictions,
    totalPredictions: exactPredictions + correctPredictions + wrongPredictions,
    currentStreak, bestStreak, bonusPoints, specialPoints,
    wildcardsUsed
  }
  }).sort((a, b) => b.totalPoints - a.totalPoints)
}

// =============================================
// SETTINGS
// =============================================

export const getSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) {
    console.error('getSettings:', error)
    return { pointsExact: 5, pointsCorrect: 3, pointsBonus: 2, bonusStreak: 3 }
  }
  return {
    pointsExact: data.points_exact,
    pointsCorrect: data.points_correct,
    pointsBonus: data.points_bonus,
    bonusStreak: data.bonus_streak
  }
}

// =============================================
// PREDICCIONES ESPECIALES (Campeón, Goleador, etc.)
// =============================================

export const getSpecialPredictions = async () => {
  const { data, error } = await supabase
    .from('special_predictions')
    .select('*')
  if (error) { console.error('getSpecialPredictions:', error); return [] }
  return data.map(p => ({
    id: p.id,
    userId: p.user_id,
    type: p.prediction_type,
    value: p.value,
    flag: p.flag,
    createdAt: p.created_at
  }))
}

export const getSpecialPredictionsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('special_predictions')
    .select('*')
    .eq('user_id', userId)
  if (error) { console.error('getSpecialPredictionsByUser:', error); return [] }
  return data.map(p => ({
    id: p.id,
    userId: p.user_id,
    type: p.prediction_type,
    value: p.value,
    flag: p.flag
  }))
}

export const saveSpecialPrediction = async (userId, type, value, flag) => {
  const { error } = await supabase
    .from('special_predictions')
    .upsert({
      user_id: userId,
      prediction_type: type,
      value: value,
      flag: flag || '🏳️',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,prediction_type'
    })
  if (error) { console.error('saveSpecialPrediction:', error); return { error: error.message } }
  return { success: true }
}

export const getSpecialResults = async () => {
  const { data, error } = await supabase
    .from('special_results')
    .select('*')
  if (error) { console.error('getSpecialResults:', error); return [] }
  return data.map(r => ({
    id: r.id,
    type: r.prediction_type,
    value: r.value,
    flag: r.flag,
    points: r.points
  }))
}

export const saveSpecialResult = async (type, value, flag, points) => {
  const { error } = await supabase
    .from('special_results')
    .upsert({
      prediction_type: type,
      value: value,
      flag: flag || '🏳️',
      points: points
    }, {
      onConflict: 'prediction_type'
    })
  if (error) { console.error('saveSpecialResult:', error); return { error: error.message } }
  return { success: true }
}

// Calcular puntos especiales para el ranking
export const getSpecialPoints = async (userId) => {
  const [predictions, results] = await Promise.all([
    getSpecialPredictionsByUser(userId),
    getSpecialResults()
  ])

  let totalSpecialPoints = 0
  const details = []

  predictions.forEach(pred => {
    const result = results.find(r => r.type === pred.type)
    if (result && pred.value.toLowerCase() === result.value.toLowerCase()) {
      totalSpecialPoints += result.points
      details.push({ type: pred.type, points: result.points, correct: true })
    } else if (result) {
      details.push({ type: pred.type, points: 0, correct: false })
    }
  })

  return { totalSpecialPoints, details }
}

// Contar partidos pendientes de predicción
export const getPendingPredictionsCount = async (userId) => {
  const [matches, predictions] = await Promise.all([
    getMatches(),
    getPredictionsByUser(userId)
  ])

  const now = new Date()
  const upcoming = matches.filter(m =>
    m.status === 'upcoming' && new Date(m.datetime) > now
  )

  const predMatchIds = predictions.map(p => p.matchId)
  const pending = upcoming.filter(m => !predMatchIds.includes(m.id))

  return pending.length
}

export const updateSettings = async (updates) => {
  const dbUpdates = {}
  if (updates.pointsExact !== undefined) dbUpdates.points_exact = updates.pointsExact
  if (updates.pointsCorrect !== undefined) dbUpdates.points_correct = updates.pointsCorrect
  if (updates.pointsBonus !== undefined) dbUpdates.points_bonus = updates.pointsBonus
  if (updates.bonusStreak !== undefined) dbUpdates.bonus_streak = updates.bonusStreak

  const { data, error } = await supabase
    .from('settings')
    .update(dbUpdates)
    .eq('id', 1)
    .select()
    .single()
  if (error) { console.error('updateSettings:', error); return null }
  return {
    pointsExact: data.points_exact, pointsCorrect: data.points_correct,
    pointsBonus: data.points_bonus, bonusStreak: data.bonus_streak
  }
}


// =============================================
// TABLA DE POSICIONES POR GRUPO
// =============================================

export const getGroupStandings = async () => {
  const matches = await getMatches()
  
  // Solo partidos de fase de grupos finalizados
  const groupMatches = matches.filter(m => m.stage === 'Fase de Grupos')
  
  // Obtener todos los equipos únicos por grupo
  const groups = {}
  
  groupMatches.forEach(match => {
    const group = match.group // "Grupo A", "Grupo B", etc.
    if (!groups[group]) groups[group] = {}
    
    // Registrar equipo local
    if (!groups[group][match.homeTeam]) {
      groups[group][match.homeTeam] = {
        name: match.homeTeam,
        flag: match.homeFlag,
        group,
        PJ: 0, G: 0, E: 0, P: 0,
        GF: 0, GC: 0, DIF: 0, PTS: 0
      }
    }
    
    // Registrar equipo visitante
    if (!groups[group][match.awayTeam]) {
      groups[group][match.awayTeam] = {
        name: match.awayTeam,
        flag: match.awayFlag,
        group,
        PJ: 0, G: 0, E: 0, P: 0,
        GF: 0, GC: 0, DIF: 0, PTS: 0
      }
    }
    
    // Solo calcular si el partido terminó
    if (match.status === 'finished' && 
        match.homeScore !== null && 
        match.awayScore !== null) {
      
      const home = groups[group][match.homeTeam]
      const away = groups[group][match.awayTeam]
      
      // Partidos jugados
      home.PJ++
      away.PJ++
      
      // Goles
      home.GF += match.homeScore
      home.GC += match.awayScore
      away.GF += match.awayScore
      away.GC += match.homeScore
      
      // Resultado
      if (match.homeScore > match.awayScore) {
        // Gana local
        home.G++; home.PTS += 3
        away.P++
      } else if (match.homeScore < match.awayScore) {
        // Gana visitante
        away.G++; away.PTS += 3
        home.P++
      } else {
        // Empate
        home.E++; home.PTS++
        away.E++; away.PTS++
      }
      
      // Diferencia de goles
      home.DIF = home.GF - home.GC
      away.DIF = away.GF - away.GC
    }
  })
  
  // Convertir a array ordenado por puntos
  const result = {}
  Object.keys(groups).sort().forEach(groupName => {
    result[groupName] = Object.values(groups[groupName])
      .sort((a, b) => {
        if (b.PTS !== a.PTS) return b.PTS - a.PTS  // 1. Puntos
        if (b.DIF !== a.DIF) return b.DIF - a.DIF  // 2. Diferencia goles
        return b.GF - a.GF                          // 3. Goles a favor
      })
  })
  
  return { groups: result, allGroupMatches: groupMatches }
}


// =============================================
// COMODINES
// =============================================

export const getWildcardsUsed = async (userId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_wildcard', true)
  if (error) { console.error('getWildcardsUsed:', error); return 0 }
  return data.length
}

export const getWildcardsRemaining = async (userId) => {
  const used = await getWildcardsUsed(userId)
  return Math.max(0, 3 - used)
}

export const getAllWildcardsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_wildcard', true)
  if (error) { console.error('getAllWildcardsByUser:', error); return [] }
  return data.map(p => ({
    id: p.id, userId: p.user_id, matchId: p.match_id,
    homeScore: p.home_score, awayScore: p.away_score,
    isWildcard: p.is_wildcard
  }))
}

// =============================================
// EVOLUCIÓN DE PUNTOS
// =============================================

export const getPointsEvolution = async () => {
  const [users, matches, predictions, settings] = await Promise.all([
    getUsers(), getMatches(), getPredictions(), getSettings()
  ])

  const finished = matches
    .filter(m => m.status === 'finished')
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))

  // Para cada usuario, calcular puntos acumulados partido a partido
  const evolution = users.map(user => {
    let accumulated = 0
    const points = finished.map((match, idx) => {
      const pred = predictions.find(
        p => p.userId === user.id && p.matchId === match.id
      )
      if (pred) {
        const result = calculatePoints(pred, match, settings)
        if (result) accumulated += result.points
      }
      return {
        matchNum: idx + 1,
        matchLabel: `${match.homeFlag}${match.awayFlag}`,
        points: accumulated
      }
    })

    return {
      id: user.id,
      name: user.name,
      emoji: user.emoji,
      data: points
    }
  })

  return evolution
}

// =============================================
// CLASIFICADOS Y GENERACIÓN DE ELIMINATORIAS
// =============================================

export const getClassifiedTeams = async () => {
  const { groups } = await getGroupStandings()
  
  const classified = {
    firsts: {},   // 1ros de cada grupo
    seconds: {},  // 2dos de cada grupo
    thirds: []    // 3ros (para elegir los 8 mejores)
  }

  Object.keys(groups).sort().forEach(groupName => {
    const teams = groups[groupName]
    const letter = groupName.replace('Grupo ', '')
    
    if (teams[0]) classified.firsts[letter] = teams[0]
    if (teams[1]) classified.seconds[letter] = teams[1]
    if (teams[2]) classified.thirds.push({ 
      ...teams[2], 
      groupLetter: letter 
    })
  })

  // Ordenar terceros por PTS, DIF, GF
  classified.thirds.sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS
    if (b.DIF !== a.DIF) return b.DIF - a.DIF
    return b.GF - a.GF
  })

  return classified
}

export const generateKnockoutMatches = async (selectedThirds, matchDatetimes) => {
  // selectedThirds: array de letters de los 8 terceros elegidos ['A','B','C',...]
  // matchDatetimes: objeto con fechas para cada partido { 'P49': '2026-06-28T18:00:00Z', ... }
  
  const { firsts, seconds, thirds } = await getClassifiedTeams()

  // Tabla oficial FIFA de cruces de Dieciseisavos
  // basado en qué grupos de terceros clasifican
  const thirdsKey = selectedThirds.sort().join('')
  
  // Definir los 16 cruces según la tabla FIFA
  // Formato: [local, visitante]
  const matches = [
    // Partido 49: 1°A vs 2°B
    { home: firsts['A'], away: seconds['B'], matchNum: 49 },
    // Partido 50: 1°C vs 3° (de A/B/F según FIFA)
    { home: firsts['C'], away: thirds.find(t => selectedThirds.includes(t.groupLetter) && ['A','B','F'].includes(t.groupLetter)), matchNum: 50 },
    // Partido 51: 1°B vs 3° (de A/C/D)
    { home: firsts['B'], away: thirds.find(t => selectedThirds.includes(t.groupLetter) && ['A','C','D'].includes(t.groupLetter)), matchNum: 51 },
    // Partido 52: 1°D vs 2°E
    { home: firsts['D'], away: seconds['E'], matchNum: 52 },
    // Partido 53: 1°E vs 2°D
    { home: firsts['E'], away: seconds['D'], matchNum: 53 },
    // Partido 54: 1°F vs 3° (de B/E/F)
    { home: firsts['F'], away: thirds.find(t => selectedThirds.includes(t.groupLetter) && ['B','E','F'].includes(t.groupLetter)), matchNum: 54 },
    // Partido 55: 2°A vs 2°C
    { home: seconds['A'], away: seconds['C'], matchNum: 55 },
    // Partido 56: 1°G vs 2°H
    { home: firsts['G'], away: seconds['H'], matchNum: 56 },
    // Partido 57: 1°H vs 2°G
    { home: firsts['H'], away: seconds['G'], matchNum: 57 },
    // Partido 58: 1°I vs 3° (de G/H/I)
    { home: firsts['I'], away: thirds.find(t => selectedThirds.includes(t.groupLetter) && ['G','H','I'].includes(t.groupLetter)), matchNum: 58 },
    // Partido 59: 1°J vs 2°K
    { home: firsts['J'], away: seconds['K'], matchNum: 59 },
    // Partido 60: 1°K vs 3° (de I/J/L)
    { home: firsts['K'], away: thirds.find(t => selectedThirds.includes(t.groupLetter) && ['I','J','L'].includes(t.groupLetter)), matchNum: 60 },
    // Partido 61: 1°L vs 3° (de G/K/L)
    { home: firsts['L'], away: thirds.find(t => selectedThirds.includes(t.groupLetter) && ['G','K','L'].includes(t.groupLetter)), matchNum: 61 },
    // Partido 62: 2°I vs 2°L
    { home: seconds['I'], away: seconds['L'], matchNum: 62 },
    // Partido 63: 2°J vs 3° (de H/J/K)
    { home: seconds['J'], away: thirds.find(t => selectedThirds.includes(t.groupLetter) && ['H','J','K'].includes(t.groupLetter)), matchNum: 63 },
    // Partido 64: 2°F vs 3° (de C/D/E)
    { home: seconds['F'], away: thirds.find(t => selectedThirds.includes(t.groupLetter) && ['C','D','E'].includes(t.groupLetter)), matchNum: 64 },
  ]

  // Insertar los partidos en Supabase
  const results = []
  for (const m of matches) {
    if (!m.home || !m.away) {
      results.push({ matchNum: m.matchNum, error: 'Equipo no encontrado' })
      continue
    }

    const datetime = matchDatetimes[`P${m.matchNum}`] || '2026-06-28T18:00:00Z'

    const result = await addMatch({
      homeTeam: m.home.name,
      homeFlag: m.home.flag,
      awayTeam: m.away.name,
      awayFlag: m.away.flag,
      group: `D16-P${m.matchNum}`,
      stage: 'Dieciseisavos',
      datetime,
      venue: ''
    })

    results.push({ matchNum: m.matchNum, success: !!result, result })
  }

  return results
}



// =============================================
// COMPATIBILIDAD (ya no se usa localStorage)
// =============================================
export const loadSampleData = () => {}
export const loadWorldCupMatches = () => {}
export const resetAllData = () => {}
