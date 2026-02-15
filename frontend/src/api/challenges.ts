import { apiPost } from './client'

export interface QuestRunCreate {
  player_id: number
  started_at: string
  ended_at: string
  duration_seconds: number
  completed: boolean
}

export function submitQuestRun(data: QuestRunCreate): Promise<unknown> {
  return apiPost('/challenges/quest-run', data)
}
