import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GameContext } from './stores/gameStore'
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

function App() {
  const [world, setWorld] = useState<World | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <GameContext.Provider value={{ world, player, setWorld, setPlayer }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/players" element={<PlayerSelectPage />} />
            <Route path="/hub" element={<HubPage />} />
            <Route path="/play" element={<GamePage />} />
            <Route path="/play/:mode" element={<GamePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/trial/:tier" element={<TrialPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </BrowserRouter>
      </GameContext.Provider>
    </QueryClientProvider>
  )
}

export default App
