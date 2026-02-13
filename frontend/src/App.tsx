import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GameContext, loadWorld, loadPlayer, saveWorld, savePlayer, clearSession } from './stores/gameStore'
import { WelcomePage } from './pages/WelcomePage'
import { PlayerSelectPage } from './pages/PlayerSelectPage'
import { HubPage } from './pages/HubPage'
import { GamePage } from './pages/GamePage'
import { ResultsPage } from './pages/ResultsPage'
import { TrialPage } from './pages/TrialPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import type { World, Player } from './types'
import './App.css'

const queryClient = new QueryClient()

function AppRoutes() {
  const [world, setWorldRaw] = useState<World | null>(loadWorld)
  const [player, setPlayerRaw] = useState<Player | null>(loadPlayer)

  const setWorld = useCallback((w: World | null) => {
    setWorldRaw(w)
    if (!w) {
      // Clearing world clears player too
      setPlayerRaw(null)
      clearSession()
    } else {
      saveWorld(w)
    }
  }, [])

  const setPlayer = useCallback((p: Player | null) => {
    setPlayerRaw(p)
    savePlayer(p)
  }, [])

  return (
    <GameContext.Provider value={{ world, player, setWorld, setPlayer }}>
      <Routes>
        <Route path="/" element={
          world && player ? <Navigate to="/hub" replace /> : <WelcomePage />
        } />
        <Route path="/players" element={<PlayerSelectPage />} />
        <Route path="/hub" element={<HubPage />} />
        <Route path="/play" element={<GamePage />} />
        <Route path="/play/:mode" element={<GamePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/trial/:tier" element={<TrialPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </GameContext.Provider>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
