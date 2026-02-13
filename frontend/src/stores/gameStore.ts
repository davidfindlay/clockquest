import { createContext, useContext } from 'react'
import type { Player, World } from '../types'

const STORAGE_KEY = 'clockquest_session'

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

interface PersistedSession {
  world: World
  player: Player
}

export function saveSession(world: World | null, player: Player | null): void {
  if (world && player) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ world, player }))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedSession
    if (data.world?.id && data.player?.id) {
      return data
    }
    return null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
