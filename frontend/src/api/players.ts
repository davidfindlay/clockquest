import { apiFetch, apiPost, apiDelete } from './client'
import type { Player, PlayerBriefing } from '../types'

export function createPlayer(nickname: string, worldId: number): Promise<Player> {
  return apiPost('/players', { nickname, world_id: worldId })
}

export function getPlayer(playerId: number): Promise<Player> {
  return apiFetch(`/players/${playerId}`)
}

export function getPlayersInWorld(worldId: number): Promise<Player[]> {
  return apiFetch(`/players/world/${worldId}`)
}

export function getPlayerBriefing(playerId: number): Promise<PlayerBriefing> {
  return apiFetch(`/players/${playerId}/briefing`)
}

export function deletePlayer(playerId: number) {
  return apiDelete(`/players/${playerId}`)
}
