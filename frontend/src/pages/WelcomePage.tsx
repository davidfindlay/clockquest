import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/UI/Button'
import { Card } from '../components/UI/Card'
import { useGame } from '../stores/gameStore'
import { createWorld, joinWorld } from '../api/worlds'

export function WelcomePage() {
  const navigate = useNavigate()
  const { setWorld } = useGame()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [worldName, setWorldName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!worldName.trim()) return
    setLoading(true)
    setError('')
    try {
      const world = await createWorld(worldName.trim())
      setWorld(world)
      navigate('/players')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setLoading(true)
    setError('')
    try {
      const world = await joinWorld(joinCode.trim())
      setWorld(world)
      navigate('/players')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          ClockQuest
        </h1>
        <p className="text-slate-400 text-lg">Master the clock, level up!</p>
      </div>

      {mode === 'choose' && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button size="lg" className="w-full" onClick={() => setMode('create')}>
            Create a World
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={() => setMode('join')}>
            Join a World
          </Button>
        </div>
      )}

      {mode === 'create' && (
        <Card className="w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Create a New World</h2>
          <input
            type="text"
            placeholder="World name..."
            value={worldName}
            onChange={e => setWorldName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-lg mb-4 outline-none focus:border-amber-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setMode('choose'); setError('') }}>Back</Button>
            <Button onClick={handleCreate} disabled={loading || !worldName.trim()} className="flex-1">
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </Card>
      )}

      {mode === 'join' && (
        <Card className="w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Join a World</h2>
          <input
            type="text"
            placeholder="Enter join code..."
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-lg mb-4 outline-none focus:border-amber-500 uppercase tracking-widest text-center font-mono"
            maxLength={6}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setMode('choose'); setError('') }}>Back</Button>
            <Button onClick={handleJoin} disabled={loading || !joinCode.trim()} className="flex-1">
              {loading ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
