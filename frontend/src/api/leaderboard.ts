import { apiFetch } from './client'
import type { LeaderboardResponse } from '../types'

export function getLeaderboard(scope: 'global' | 'world', worldId?: number): Promise<LeaderboardResponse> {
  let path = `/leaderboard?scope=${scope}`
  if (scope === 'world' && worldId) {
    path += `&world_id=${worldId}`
  }
  return apiFetch(path)
}
