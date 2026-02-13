import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/UI/Button'
import { Card } from '../components/UI/Card'
import { TierBadge } from '../components/Progression/TierBadge'
import { useGame } from '../stores/gameStore'
import { getPlayersInWorld, createPlayer } from '../api/players'
import type { Player } from '../types'

export function PlayerSelectPage() {
  const navigate = useNavigate()
  const { world, setWorld, setPlayer } = useGame()
  const [players, setPlayers] = useState<Player[]>([])
  const [creating, setCreating] = useState(false)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!world) {
      navigate('/')
      return
    }
    getPlayersInWorld(world.id).then(setPlayers)
  }, [world, navigate])

  const handleSelectPlayer = (player: Player) => {
    setPlayer(player)
    navigate('/hub')
  }

  const handleCreate = async () => {
    if (!nickname.trim() || !world) return
    setError('')
    try {
      const player = await createPlayer(nickname.trim(), world.id)
      setPlayer(player)
      navigate('/hub')
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (!world) return null

  return (
    <div className="min-h-full flex flex-col items-center p-6 pt-12">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-1">{world.name}</h1>
        <p className="text-slate-400">Join code: <span className="font-mono text-amber-400">{world.join_code}</span></p>
      </div>

      <h2 className="text-xl font-bold mb-4">Choose your player</h2>

      <div className="w-full max-w-md flex flex-col gap-3 mb-6">
        {players.map(p => (
          <button
            key={p.id}
            onClick={() => handleSelectPlayer(p)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{p.nickname}</span>
              <TierBadge tier={p.current_tier} size="sm" />
            </div>
            <span className="text-amber-400 font-mono font-bold">{Math.round(p.clock_power)}</span>
          </button>
        ))}
      </div>

      {!creating ? (
        <Button variant="secondary" onClick={() => setCreating(true)}>
          + New Player
        </Button>
      ) : (
        <Card className="w-full max-w-md">
          <input
            type="text"
            placeholder="Nickname..."
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-lg mb-3 outline-none focus:border-amber-500"
            maxLength={50}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nickname.trim()} className="flex-1">Create</Button>
          </div>
        </Card>
      )}

      <Button variant="ghost" className="mt-6" onClick={() => { setWorld(null); navigate('/') }}>
        Change World
      </Button>
    </div>
  )
}
