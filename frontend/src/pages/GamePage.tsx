import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ReadTheClock } from '../components/Game/ReadTheClock'
import { SetTheClock } from '../components/Game/SetTheClock'
import { QuestRun } from '../components/Game/QuestRun'
import { Button } from '../components/UI/Button'
import { useGame } from '../stores/gameStore'
import { submitSession } from '../api/sessions'
import { getTierByIndex } from '../utils/tier-config'
import { SET_CLOCK_ADVANCED_HINT_PROGRESS_THRESHOLD } from '../utils/game-config'
import type { Difficulty, GameMode, SessionCreate } from '../types'

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'hour', label: 'Hours Only' },
  { id: 'half', label: 'Half Hours' },
  { id: 'quarter', label: 'Quarters' },
  { id: 'five_min', label: '5 Minutes' },
  { id: 'one_min', label: 'Any Minute' },
]

const MODES: { id: GameMode; label: string; description: string }[] = [
  { id: 'read', label: 'Read the Clock', description: 'What time does the clock show?' },
  { id: 'set', label: 'Set the Clock', description: 'Drag hands to match the time' },
]

export function GamePage() {
  const { mode: urlMode } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { player, setPlayer } = useGame()
  const [mode, setMode] = useState<GameMode | null>((urlMode as GameMode) || null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)

  if (!player) {
    navigate('/')
    return null
  }

  const handleComplete = async (result: Omit<SessionCreate, 'player_id'>) => {
    const sessionResult = await submitSession({ ...result, player_id: player.id })
    setPlayer(sessionResult.player)
    navigate('/results', { state: { result: sessionResult } })
  }

  // Quest mode — skip pickers, render QuestRun directly
  if (mode === 'quest') {
    const tierInfo = getTierByIndex(player.current_tier)
    return (
      <div className="min-h-full p-6 pt-8 flex flex-col items-center">
        <QuestRun tierInfo={tierInfo} onComplete={handleComplete} />
      </div>
    )
  }

  // Mode selection (manual play — read/set only)
  if (!mode) {
    return (
      <div className="min-h-full p-6 pt-12 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">Choose a Mode</h1>
        <div className="flex flex-col gap-3 w-full max-w-md">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-5 text-left transition-all active:scale-98"
            >
              <div className="text-lg font-bold">{m.label}</div>
              <div className="text-sm text-slate-400">{m.description}</div>
            </button>
          ))}
        </div>
        <Button variant="ghost" className="mt-6" onClick={() => navigate('/hub')}>Back to Hub</Button>
      </div>
    )
  }

  // Difficulty selection
  if (!difficulty) {
    return (
      <div className="min-h-full p-6 pt-12 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-2">
          {MODES.find(m => m.id === mode)?.label}
        </h1>
        <p className="text-slate-400 mb-6">Pick your difficulty</p>
        <div className="flex flex-col gap-3 w-full max-w-md">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-lg font-bold text-left transition-all active:scale-98"
            >
              {d.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" className="mt-6" onClick={() => setMode(null)}>Change Mode</Button>
      </div>
    )
  }

  // Playing (manual mode)
  const tierInfo = getTierByIndex(player.current_tier)
  const tierRange = Math.max(1, tierInfo.maxPower - tierInfo.minPower)
  const tierProgressPct = ((player.clock_power - tierInfo.minPower) / tierRange) * 100
  const advancedSetHintMode = tierProgressPct >= SET_CLOCK_ADVANCED_HINT_PROGRESS_THRESHOLD

  return (
    <div className="min-h-full p-6 pt-8 flex flex-col items-center">
      {mode === 'read' && (
        <ReadTheClock playerId={player.id} difficulty={difficulty} timeFormatMix={tierInfo.timeFormatMix} onComplete={handleComplete} />
      )}
      {mode === 'set' && (
        <SetTheClock
          playerId={player.id}
          difficulty={difficulty}
          timeFormatMix={tierInfo.timeFormatMix}
          advancedHintMode={advancedSetHintMode}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
