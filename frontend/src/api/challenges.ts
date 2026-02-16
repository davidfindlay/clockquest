import { apiPost } from './client'

export interface QuestRunCreate {
  player_id: number
  started_at: string
  ended_at: string
  duration_seconds: number
  completed: boolean
}

export interface QuestStartTipRequest {
  player_id: number
  tier_index: number
}

export interface CharacterTip {
  character: 'tick' | 'tock'
  message: string
  tip_id: string
}

export function submitQuestRun(data: QuestRunCreate): Promise<unknown> {
  return apiPost('/challenges/quest-run', data)
}

export function getQuestStartTip(data: QuestStartTipRequest): Promise<CharacterTip | null> {
  return apiPost('/challenges/quest-start-tip', data)
}
