// --- World ---
export interface World {
  id: number
  name: string
  join_code: string
  created_at: string
  player_count: number
}

// --- Player ---
export interface Player {
  id: number
  nickname: string
  world_id: number
  clock_power: number
  current_tier: number
  created_at: string
}

export interface PlayerBriefing {
  player: Player
  tier_name: string
  tier_color: string
  next_tier_name: string | null
  next_tier_threshold: number | null
  tier_progress_pct: number
  mastered_skills: string[]
  quests: Quest[]
}

// --- Session ---
export interface SessionCreate {
  player_id: number
  mode: 'read' | 'set' | 'speedrun' | 'quest'
  difficulty: Difficulty
  questions: number
  correct: number
  hints_used: number
  avg_response_ms?: number
  speedrun_score?: number
}

export interface Session {
  id: number
  player_id: number
  mode: string
  difficulty: string
  questions: number
  correct: number
  hints_used: number
  avg_response_ms: number | null
  speedrun_score: number | null
  points_earned: number
  created_at: string
}

export interface SessionResult {
  session: Session
  player: Player
  points_earned: number
  new_clock_power: number
  new_tier: number
  tier_up: boolean
  quest_updates: Quest[]
}

// --- Tier Trial ---
export interface TierTrialConfig {
  tier: number
  tier_name: string
  difficulty: string
  questions: number
  min_correct: number
  max_hints: number
  speed_gate: boolean
}

export interface TierTrialSubmit {
  player_id: number
  tier: number
  questions: number
  correct: number
  hints_used: number
  time_ms?: number
}

export interface TierTrialResult {
  trial: {
    id: number
    player_id: number
    tier: number
    passed: boolean
    questions: number
    correct: number
    hints_used: number
    time_ms: number | null
    created_at: string
  }
  passed: boolean
  player: Player
  tier_name: string
  message: string
}

// --- Quest ---
export interface Quest {
  id: number
  player_id: number
  quest_type: string
  description: string
  target: number
  progress: number
  completed: boolean
  mode: string | null
  difficulty: string | null
}

// --- Leaderboard ---
export interface LeaderboardEntry {
  rank: number
  player_id: number
  nickname: string
  clock_power: number
  current_tier: number
  tier_name: string
  weekly_gain: number
}

export interface LeaderboardResponse {
  scope: string
  entries: LeaderboardEntry[]
}

// --- Difficulty ---
export type Difficulty = 'hour' | 'half' | 'quarter' | 'five_min' | 'one_min' | 'interval'

// --- Game Mode ---
export type GameMode = 'read' | 'set' | 'speedrun' | 'quest'
