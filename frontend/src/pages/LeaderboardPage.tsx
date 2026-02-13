import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LeaderboardTable } from '../components/Leaderboard/LeaderboardTable'
import { Button } from '../components/UI/Button'
import { useGame } from '../stores/gameStore'
import { getLeaderboard } from '../api/leaderboard'
import type { LeaderboardEntry } from '../types'

export function LeaderboardPage() {
  const navigate = useNavigate()
  const { world, player } = useGame()
  const [scope, setScope] = useState<'world' | 'global'>('world')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getLeaderboard(scope, world?.id)
      .then(res => setEntries(res.entries))
      .finally(() => setLoading(false))
  }, [scope, world?.id])

  return (
    <div className="min-h-full p-6 pt-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Leaderboard</h1>

        {/* Scope toggle */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setScope('world')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              scope === 'world' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400'
            }`}
          >
            World
          </button>
          <button
            onClick={() => setScope('global')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              scope === 'global' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Global
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-8">Loading...</div>
        ) : (
          <LeaderboardTable entries={entries} currentPlayerId={player?.id} />
        )}

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/hub')}>Back to Hub</Button>
        </div>
      </div>
    </div>
  )
}
