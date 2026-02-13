import { apiFetch, apiPost, apiDelete } from './client'
import type { World } from '../types'

export function createWorld(name: string, pin?: string): Promise<World> {
  return apiPost('/worlds', { name, pin })
}

export function joinWorld(joinCode: string): Promise<World> {
  return apiFetch(`/worlds/join/${joinCode.toUpperCase()}`)
}

export function getWorld(worldId: number): Promise<World> {
  return apiFetch(`/worlds/${worldId}`)
}

export function deleteWorld(worldId: number) {
  return apiDelete(`/worlds/${worldId}`)
}
