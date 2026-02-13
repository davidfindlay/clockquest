import { createContext, useContext } from 'react'
import type { Player, World } from '../types'

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
