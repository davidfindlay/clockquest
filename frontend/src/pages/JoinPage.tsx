import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../stores/gameStore'
import { joinWorld } from '../api/worlds'

export function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { world, setWorld } = useGame()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) {
      navigate('/')
      return
    }

    // If already in the same world, skip straight to player select
    if (world && world.join_code.toUpperCase() === code.toUpperCase()) {
      navigate('/players', { replace: true })
      return
    }

    let cancelled = false

    async function join() {
      try {
        const w = await joinWorld(code!)
        if (!cancelled) {
          setWorld(w)
          navigate('/players', { replace: true })
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to join world')
        }
      }
    }

    join()
    return () => { cancelled = true }
  }, [code, world, setWorld, navigate])

  if (error) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            ClockQuest
          </h1>
          <p className="text-red-400 text-lg mb-6">{error}</p>
          <p className="text-slate-400 mb-4">
            The join code <span className="font-mono text-amber-400">{code?.toUpperCase()}</span> doesn't seem to be valid.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-amber-400 hover:text-amber-300 underline text-lg"
          >
            Go to Welcome Screen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          ClockQuest
        </h1>
        <p className="text-slate-400 text-lg">Joining world...</p>
      </div>
    </div>
  )
}
