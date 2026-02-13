import { createContext, useContext } from 'react'
import type { Player, World } from '../types'

const WORLD_KEY = 'clockquest_world'
const PLAYER_KEY = 'clockquest_player'

export interface GameState {
  world: World | null
  player: Player | null
  setWorld: (w: World | null) => void
  setPlayer: (p: Player | null) => void
}

export const GameContext = createContext<GameState>({
  world: null,
  player: null,
  setWorld: () => {},
  setPlayer: () => {},
})

export function useGame() {
  return useContext(GameContext)
}

// --- localStorage persistence ---

export function saveWorld(world: World | null): void {
  if (world) {
    localStorage.setItem(WORLD_KEY, JSON.stringify(world))
  } else {
    localStorage.removeItem(WORLD_KEY)
    localStorage.removeItem(PLAYER_KEY)
  }
}

export function savePlayer(player: Player | null): void {
  if (player) {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
  } else {
    localStorage.removeItem(PLAYER_KEY)
  }
}

export function loadWorld(): World | null {
  try {
    const raw = localStorage.getItem(WORLD_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as World
    return data?.id ? data : null
  } catch {
    localStorage.removeItem(WORLD_KEY)
    return null
  }
}

export function loadPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(PLAYER_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Player
    return data?.id ? data : null
  } catch {
    localStorage.removeItem(PLAYER_KEY)
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(WORLD_KEY)
  localStorage.removeItem(PLAYER_KEY)
}
