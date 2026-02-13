import { useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GameContext, loadSession, saveSession, clearSession } from './stores/gameStore'
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
  const saved = loadSession()
  const [world, setWorldRaw] = useState<World | null>(saved?.world ?? null)
  const [player, setPlayerRaw] = useState<Player | null>(saved?.player ?? null)

  const setWorld = useCallback((w: World | null) => {
    setWorldRaw(w)
    if (!w) {
      // Clearing world clears player too
      setPlayerRaw(null)
      clearSession()
    }
  }, [])

  const setPlayer = useCallback((p: Player | null) => {
    setPlayerRaw(p)
    if (p) {
      // Use functional update to read latest world without a dependency
      setWorldRaw(currentWorld => {
        if (currentWorld) saveSession(currentWorld, p)
        return currentWorld
      })
    } else {
      clearSession()
    }
  }, [])

  // Also persist when world changes with an existing player
  useEffect(() => {
    if (world && player) {
      saveSession(world, player)
    }
  }, [world, player])

  return (
    <GameContext.Provider value={{ world, player, setWorld, setPlayer }}>
      <Routes>
        <Route path="/" element={
          // If we have a saved session, go straight to hub
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
