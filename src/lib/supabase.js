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
    status: m.status,
    isPenalty: m.is_penalty || false,
    penaltyWinner: m.penalty_winner || null,
    penaltyHome: m.penalty_home,
    penaltyAway: m.penalty_away
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
    venue: data.venue, homeScore: data.home_score, awayScore: data.away_score,
    status: data.status,
    isPenalty: data.is_penalty || false,
    penaltyWinner: data.penalty_winner || null,
    penaltyHome: data.penalty_home,
    penaltyAway: data.penalty_away
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
  if (updates.isPenalty !== undefined) dbUpdates.is_penalty = updates.isPenalty
  if (updates.penaltyWinner !== undefined) dbUpdates.penalty_winner = updates.penaltyWinner
  if (updates.penaltyHome !== undefined) dbUpdates.penalty_home = updates.penaltyHome
  if (updates.penaltyAway !== undefined) dbUpdates.penalty_away = updates.penaltyAway

  const { data, error } = await supabase
    .from('matches')
    .update(dbUpdates)
    .eq('id', matchId)
    .select()
    .single()

  if (error) {
    console.error('updateMatch:', error)
    return null
  }

  const result = {
    id: data.id,
    homeTeam: data.home_team,
    homeFlag: data.home_flag,
    awayTeam: data.away_team,
    awayFlag: data.away_flag,
    group: data.match_group,
    stage: data.stage,
    datetime: data.datetime,
    venue: data.venue,
    homeScore: data.home_score,
    awayScore: data.away_score,
    status: data.status
  }

  // ✅ Propagar automáticamente en eliminatorias
  if (
    updates.status === 'finished' &&
    updates.homeScore !== undefined &&
    updates.awayScore !== undefined &&
    ['Dieciseisavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal'].includes(data.stage)
  ) {
    // Si hay penales, usar el penaltyWinner para propagar
    const matchForPropagation = {
      ...result,
      // Si es penalty, forzar el ganador correcto
      homeScore: data.is_penalty && data.penalty_winner === data.home_team
        ? 1 : result.homeScore,
      awayScore: data.is_penalty && data.penalty_winner === data.away_team
        ? 1 : result.awayScore,
    }

    // Si es empate y hay penalty_winner, ajustar para que propague bien
    if (data.is_penalty && data.penalty_winner) {
      if (data.penalty_winner === data.home_team) {
        matchForPropagation.homeScore = result.homeScore + 1
        matchForPropagation.awayScore = result.awayScore
      } else {
        matchForPropagation.homeScore = result.homeScore
        matchForPropagation.awayScore = result.awayScore + 1
      }
    }

    const propagation = await propagateBracket(matchForPropagation)
    if (propagation?.propagated) {
      console.log(`🏆 ${propagation.winner} avanzó a ${propagation.nextMatch}`)
    } else if (propagation?.error) {
      console.warn(`⚠️ ${propagation.error}`)
    }
  }

  return result
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
    predictsDraw: p.predicts_draw || false,
    penaltyWinner: p.penalty_winner || null,
    penaltyHome: p.penalty_home,
    penaltyAway: p.penalty_away,
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
    isWildcard: data.is_wildcard || false,
    predictsDraw: data.predicts_draw || false,
    penaltyWinner: data.penalty_winner || null,
    penaltyHome: data.penalty_home,
    penaltyAway: data.penalty_away
  }
}

export const savePrediction = async (userId, matchId, homeScore, awayScore, isWildcard = false, penaltyData = null) => {
  const match = await getMatchById(matchId)
  if (match && new Date(match.datetime) <= new Date()) {
    return { error: '¡El partido ya comenzó! No puedes predecir.' }
  }

  if (isWildcard) {
    const used = await getWildcardsUsed(userId)
    const existingPred = await getPrediction(userId, matchId)
    const alreadyWildcard = existingPred?.isWildcard || false
    if (used >= 3 && !alreadyWildcard) {
      return { error: '¡Ya usaste tus 3 comodines! 🃏' }
    }
  }

  const upsertData = {
    user_id: userId,
    match_id: matchId,
    home_score: homeScore,
    away_score: awayScore,
    is_wildcard: isWildcard,
    predicts_draw: homeScore === awayScore,
    penalty_winner: penaltyData?.penaltyWinner || null,
    penalty_home: penaltyData?.penaltyHome || null,
    penalty_away: penaltyData?.penaltyAway || null,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('predictions')
    .upsert(upsertData, { onConflict: 'user_id,match_id' })

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
  const isKnockout = ['Dieciseisavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final'].includes(match.stage)

  let totalPoints = 0
  let breakdown = []

  // 1) Resultado en 90 minutos (exacto o ganador)
  if (prediction.homeScore === match.homeScore &&
      prediction.awayScore === match.awayScore) {
    totalPoints += s.pointsExact
    breakdown.push({ label: 'Resultado exacto 90min', points: s.pointsExact })
  } else {
    const predResult = prediction.homeScore > prediction.awayScore ? 'home'
      : prediction.homeScore < prediction.awayScore ? 'away' : 'draw'
    const matchResult = match.homeScore > match.awayScore ? 'home'
      : match.homeScore < match.awayScore ? 'away' : 'draw'

    if (predResult === matchResult) {
      totalPoints += s.pointsCorrect
      breakdown.push({ label: 'Ganador/empate correcto', points: s.pointsCorrect })
    }
  }

  // 2) Bonus penales (solo en eliminatorias con penales)
  if (isKnockout && match.isPenalty) {
    // Acertó que iba a penales (predijo empate y fue empate)
    if (prediction.predictsDraw && match.homeScore === match.awayScore) {
      totalPoints += s.pointsCorrect
      breakdown.push({ label: 'Acertó penales', points: s.pointsCorrect })
    }

    // Acertó quién clasifica en penales
    if (prediction.penaltyWinner && match.penaltyWinner &&
        prediction.penaltyWinner === match.penaltyWinner) {
      totalPoints += s.pointsCorrect
      breakdown.push({ label: 'Acertó clasificado', points: s.pointsCorrect })
    }

    // Acertó resultado exacto de penales
    if (prediction.penaltyHome !== null && prediction.penaltyAway !== null &&
        match.penaltyHome !== null && match.penaltyAway !== null &&
        prediction.penaltyHome === match.penaltyHome &&
        prediction.penaltyAway === match.penaltyAway) {
      totalPoints += s.pointsExact
      breakdown.push({ label: 'Penales exactos', points: s.pointsExact })
    }
  }

  // Aplicar multiplicador del comodín
  totalPoints = totalPoints * multiplier

  // Determinar tipo para el estilo visual
  const type = totalPoints === 0 ? 'wrong'
    : breakdown.some(b => b.label.includes('exacto')) ? 'exact'
    : 'correct'

  return {
    points: totalPoints,
    type,
    isWildcard: prediction.isWildcard,
    basePoints: totalPoints / multiplier,
    breakdown,
    isPenalty: match.isPenalty
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
  const officialThirdOrder = [
    'RD Congo',
    'Suecia',
    'Ghana',
    'Ecuador',
    'Bosnia',
    'Argelia',
    'Paraguay',
    'Senegal'
  ]

  const getOfficialThirdIndex = (teamName) => {
    const idx = officialThirdOrder.indexOf(teamName)
    return idx === -1 ? 999 : idx
  }

  // Ordenar terceros por PTS, DIF, GF y luego orden oficial
  classified.thirds.sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS
    if (b.DIF !== a.DIF) return b.DIF - a.DIF
    if (b.GF !== a.GF) return b.GF - a.GF
    return getOfficialThirdIndex(a.name) - getOfficialThirdIndex(b.name)
  })

  return classified
}

export const generateKnockoutMatches = async (selectedThirds, matchDatetimes) => {
  const { firsts, seconds, thirds } = await getClassifiedTeams()

  // Crear mapa de terceros por grupo para acceso directo
  const thirdByGroup = {}
  thirds.forEach(t => {
    if (selectedThirds.includes(t.groupLetter)) {
      thirdByGroup[t.groupLetter] = t
    }
  })

  // Los 8 grupos clasificados ordenados
  const qualifiedGroups = selectedThirds.sort()
  const key = qualifiedGroups.join('')

  // Tabla oficial FIFA: según qué 8 grupos de terceros clasifican,
  // se asigna cada tercero a un partido específico
  // Formato: { partidoNum: grupoDelTercero }
  const thirdAssignments = getThirdAssignments(key, qualifiedGroups)

  // Los 16 cruces oficiales FIFA
  const knockoutBracket = [
    // Lado A del cuadro
    { num: 49, home: firsts['A'], away: thirdAssignments['P49'] ? thirdByGroup[thirdAssignments['P49']] : null },
    { num: 50, home: seconds['A'], away: seconds['C'] },
    { num: 51, home: firsts['C'], away: thirdAssignments['P51'] ? thirdByGroup[thirdAssignments['P51']] : null },
    { num: 52, home: seconds['B'], away: seconds['D'] },
    { num: 53, home: firsts['B'], away: thirdAssignments['P53'] ? thirdByGroup[thirdAssignments['P53']] : null },
    { num: 54, home: seconds['E'], away: seconds['F'] },
    { num: 55, home: firsts['D'], away: thirdAssignments['P55'] ? thirdByGroup[thirdAssignments['P55']] : null },
    { num: 56, home: firsts['E'], away: seconds['G'] },

    // Lado B del cuadro
    { num: 57, home: firsts['F'], away: seconds['I'] },
    { num: 58, home: firsts['G'], away: thirdAssignments['P58'] ? thirdByGroup[thirdAssignments['P58']] : null },
    { num: 59, home: firsts['H'], away: thirdAssignments['P59'] ? thirdByGroup[thirdAssignments['P59']] : null },
    { num: 60, home: firsts['I'], away: seconds['H'] },
    { num: 61, home: firsts['J'], away: thirdAssignments['P61'] ? thirdByGroup[thirdAssignments['P61']] : null },
    { num: 62, home: firsts['K'], away: seconds['L'] },
    { num: 63, home: firsts['L'], away: thirdAssignments['P63'] ? thirdByGroup[thirdAssignments['P63']] : null },
    { num: 64, home: seconds['J'], away: seconds['K'] },
  ]

  // Insertar los partidos en Supabase
  const results = []
  for (const m of knockoutBracket) {
    if (!m.home || !m.away) {
      console.error(`Partido P${m.num}: equipo no encontrado`, {
        home: m.home?.name || 'FALTA',
        away: m.away?.name || 'FALTA'
      })
      results.push({ matchNum: m.num, error: `Equipo faltante en P${m.num}` })
      continue
    }

    const datetime = matchDatetimes?.[`P${m.num}`] || '2026-06-28T18:00:00Z'

    const result = await addMatch({
      homeTeam: m.home.name,
      homeFlag: m.home.flag,
      awayTeam: m.away.name,
      awayFlag: m.away.flag,
      group: `D16-P${m.num}`,
      stage: 'Dieciseisavos',
      datetime,
      venue: ''
    })

    results.push({ matchNum: m.num, success: !!result })
  }

  return results
}

// Tabla FIFA de asignación de terceros según combinación de grupos clasificados
function getThirdAssignments(key, qualifiedGroups) {
  // Para el Mundial 2026: 12 grupos, clasifican 8 terceros
  // Hay muchas combinaciones posibles
  // Esta función mapea cada tercero al partido que le corresponde
  
  // Partidos donde juegan terceros:
  // P49: 1°A vs 3°?
  // P51: 1°C vs 3°?
  // P53: 1°B vs 3°?
  // P55: 1°D vs 3°?
  // P58: 1°G vs 3°?
  // P59: 1°H vs 3°?
  // P61: 1°J vs 3°?
  // P63: 1°L vs 3°?

  // Tabla simplificada para las combinaciones más comunes
  // Clave: grupos de terceros ordenados
  // Valor: asignación de cada tercero a cada partido
  
  const tables = {
    // Combinación: B,D,E,F,I,J,K,L (tu caso actual)
    'BDEFIJKL': {
      'P49': 'E',   // 1°A vs 3°E
      'P51': 'B',   // 1°C vs 3°B
      'P53': 'F',   // 1°B vs 3°F
      'P55': 'D',   // 1°D vs 3°D
      'P58': 'I',   // 1°G vs 3°I
      'P59': 'J',   // 1°H vs 3°J
      'P61': 'K',   // 1°J vs 3°K
      'P63': 'L',   // 1°L vs 3°L
    },
    // Otras combinaciones posibles (agregar según se necesiten)
    'ABCDEFGH': {
      'P49': 'C', 'P51': 'A', 'P53': 'B',
      'P55': 'D', 'P58': 'G', 'P59': 'H',
      'P61': 'E', 'P63': 'F',
    },
    'ABCDEFGI': {
      'P49': 'C', 'P51': 'A', 'P53': 'B',
      'P55': 'D', 'P58': 'G', 'P59': 'I',
      'P61': 'E', 'P63': 'F',
    },
    'ABCDEFGJ': {
      'P49': 'C', 'P51': 'A', 'P53': 'B',
      'P55': 'D', 'P58': 'G', 'P59': 'J',
      'P61': 'E', 'P63': 'F',
    },
  }

  // Buscar en la tabla
  if (tables[key]) {
    return tables[key]
  }

  // Fallback: si no encontramos la combinación exacta,
  // asignar en orden (no ideal pero funciona)
  console.warn(`Combinación de terceros ${key} no encontrada en tabla FIFA. Usando fallback.`)
  const thirdSlots = ['P49', 'P51', 'P53', 'P55', 'P58', 'P59', 'P61', 'P63']
  const assignment = {}
  qualifiedGroups.forEach((group, idx) => {
    if (thirdSlots[idx]) {
      assignment[thirdSlots[idx]] = group
    }
  })
  return assignment
}


// =============================================
// PROPAGACIÓN AUTOMÁTICA DEL BRACKET
// =============================================

// Mapa real del bracket actual
const BRACKET_MAP = {
  // Dieciseisavos → Octavos
  'D16-P49': { next: 'OCT-1', side: 'home' },
  'D16-P50': { next: 'OCT-1', side: 'away' },

  'D16-P53': { next: 'OCT-2', side: 'home' },
  'D16-P54': { next: 'OCT-2', side: 'away' },

  'D16-P51': { next: 'OCT-3', side: 'home' },
  'D16-P52': { next: 'OCT-3', side: 'away' },

  'D16-P55': { next: 'OCT-4', side: 'home' },
  'D16-P56': { next: 'OCT-4', side: 'away' },

  'D16-P57': { next: 'OCT-5', side: 'home' },
  'D16-P58': { next: 'OCT-5', side: 'away' },

  'D16-P59': { next: 'OCT-6', side: 'home' },
  'D16-P60': { next: 'OCT-6', side: 'away' },

  'D16-P61': { next: 'OCT-7', side: 'home' },
  'D16-P64': { next: 'OCT-7', side: 'away' },

  'D16-P62': { next: 'OCT-8', side: 'home' },
  'D16-P63': { next: 'OCT-8', side: 'away' },

  // Octavos → Cuartos
  'OCT-1': { next: 'Cuartos 1', side: 'home' },
  'OCT-2': { next: 'Cuartos 1', side: 'away' },

  'OCT-3': { next: 'Cuartos 2', side: 'home' },
  'OCT-4': { next: 'Cuartos 2', side: 'away' },

  'OCT-5': { next: 'Cuartos 3', side: 'home' },
  'OCT-6': { next: 'Cuartos 3', side: 'away' },

  'OCT-7': { next: 'Cuartos 4', side: 'home' },
  'OCT-8': { next: 'Cuartos 4', side: 'away' },

  // Cuartos → Semifinal
  'Cuartos 1': { next: 'Semi 1', side: 'home' },
  'Cuartos 2': { next: 'Semi 1', side: 'away' },

  'Cuartos 3': { next: 'Semi 2', side: 'home' },
  'Cuartos 4': { next: 'Semi 2', side: 'away' },

  // Semis → Final y Tercer Puesto
  'Semi 1': {
    next: '⭐ FINAL ⭐',
    side: 'home',
    loserNext: '3er Puesto',
    loserSide: 'home'
  },
  'Semi 2': {
    next: '⭐ FINAL ⭐',
    side: 'away',
    loserNext: '3er Puesto',
    loserSide: 'away'
  },
}

const getMatchWinner = (match) => {
  if (match.homeScore > match.awayScore) {
    return { name: match.homeTeam, flag: match.homeFlag }
  }
  if (match.awayScore > match.homeScore) {
    return { name: match.awayTeam, flag: match.awayFlag }
  }
  return null
}

const getMatchLoser = (match) => {
  if (match.homeScore > match.awayScore) {
    return { name: match.awayTeam, flag: match.awayFlag }
  }
  if (match.awayScore > match.homeScore) {
    return { name: match.homeTeam, flag: match.homeFlag }
  }
  return null
}

export const propagateBracket = async (finishedMatch) => {
  const mapping = BRACKET_MAP[finishedMatch.group]
  if (!mapping) return { propagated: false }

  const winner = getMatchWinner(finishedMatch)
  if (!winner) {
    return { error: 'Empate: la app no sabe quién avanzó. Define un ganador manualmente en el marcador.' }
  }

  const allMatches = await getMatches()
  const nextMatch = allMatches.find(m => m.group === mapping.next)

  if (!nextMatch) {
    return { error: `No se encontró el partido siguiente: ${mapping.next}` }
  }

  const updates = {}
  if (mapping.side === 'home') {
    updates.homeTeam = winner.name
    updates.homeFlag = winner.flag
  } else {
    updates.awayTeam = winner.name
    updates.awayFlag = winner.flag
  }

  await updateMatch(nextMatch.id, updates)

  // Si viene de semifinal, también mandar al perdedor al 3er puesto
  if (mapping.loserNext) {
    const loser = getMatchLoser(finishedMatch)
    if (loser) {
      const loserMatch = allMatches.find(m => m.group === mapping.loserNext)
      if (loserMatch) {
        const loserUpdates = {}
        if (mapping.loserSide === 'home') {
          loserUpdates.homeTeam = loser.name
          loserUpdates.homeFlag = loser.flag
        } else {
          loserUpdates.awayTeam = loser.name
          loserUpdates.awayFlag = loser.flag
        }
        await updateMatch(loserMatch.id, loserUpdates)
      }
    }
  }

  return {
    propagated: true,
    winner: winner.name,
    nextMatch: mapping.next
  }
}



// =============================================
// COMPATIBILIDAD (ya no se usa localStorage)
// =============================================
export const loadSampleData = () => {}
export const loadWorldCupMatches = () => {}
export const resetAllData = () => {}
