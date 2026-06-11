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
    id: p.id, userId: p.user_id, matchId: p.match_id,
    homeScore: p.home_score, awayScore: p.away_score
  }))
}

export const getPredictionsByMatch = async (matchId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)
  if (error) { console.error('getPredictionsByMatch:', error); return [] }
  return data.map(p => ({
    id: p.id, userId: p.user_id, matchId: p.match_id,
    homeScore: p.home_score, awayScore: p.away_score
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
    homeScore: data.home_score, awayScore: data.away_score
  }
}

export const savePrediction = async (userId, matchId, homeScore, awayScore) => {
  // Verificar que el partido no haya comenzado
  const match = await getMatchById(matchId)
  if (match && new Date(match.datetime) <= new Date()) {
    return { error: '¡El partido ya comenzó! No puedes predecir.' }
  }

  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: userId,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
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

  if (prediction.homeScore === match.homeScore &&
      prediction.awayScore === match.awayScore) {
    return { points: s.pointsExact, type: 'exact' }
  }

  const predResult = prediction.homeScore > prediction.awayScore ? 'home'
    : prediction.homeScore < prediction.awayScore ? 'away' : 'draw'
  const matchResult = match.homeScore > match.awayScore ? 'home'
    : match.homeScore < match.awayScore ? 'away' : 'draw'

  if (predResult === matchResult) {
    return { points: s.pointsCorrect, type: 'correct' }
  }

  return { points: 0, type: 'wrong' }
}

// =============================================
// RANKING
// =============================================

export const getRanking = async () => {
  const [users, matches, predictions, settings] = await Promise.all([
    getUsers(),
    getMatches(),
    getPredictions(),
    getSettings()
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

    const userPreds = predictions
      .filter(p => p.userId === user.id)
      .sort((a, b) => {
        const ma = matches.find(m => m.id === a.matchId)
        const mb = matches.find(m => m.id === b.matchId)
        return new Date(ma?.datetime || 0) - new Date(mb?.datetime || 0)
      })

    userPreds.forEach(pred => {
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

    const bonusPoints = Math.floor(bestStreak / settings.bonusStreak) * settings.pointsBonus
    totalPoints += bonusPoints

    return {
      ...user, totalPoints, exactPredictions, correctPredictions,
      wrongPredictions,
      totalPredictions: exactPredictions + correctPredictions + wrongPredictions,
      currentStreak, bestStreak, bonusPoints
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
// COMPATIBILIDAD (ya no se usa localStorage)
// =============================================
export const loadSampleData = () => {}
export const loadWorldCupMatches = () => {}
export const resetAllData = () => {}