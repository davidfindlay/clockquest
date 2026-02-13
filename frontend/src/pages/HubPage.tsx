import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MasteryBriefing } from '../components/Progression/MasteryBriefing'
import { useGame } from '../stores/gameStore'
import { getPlayerBriefing } from '../api/players'
import type { PlayerBriefing } from '../types'

export function HubPage() {
  const navigate = useNavigate()
  const { player, setPlayer, setWorld } = useGame()
  const [briefing, setBriefing] = useState<PlayerBriefing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!player) {
      navigate('/')
      return
    }
    setLoading(true)
    getPlayerBriefing(player.id)
      .then(b => {
        setBriefing(b)
        setPlayer(b.player)
      })
      .finally(() => setLoading(false))
  }, [player?.id])

  if (!player) return null

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-slate-400 text-xl">Loading...</div>
      </div>
    )
  }

  if (!briefing) return null

  return (
    <div className="min-h-full p-6 pt-8 pb-20">
      <MasteryBriefing
        briefing={briefing}
        onStartQuest={() => navigate('/play/read')}
        onStartTrial={() => navigate(`/trial/${player.current_tier + 1}`)}
        onLeaderboard={() => navigate('/leaderboard')}
        onSwitchPlayer={() => { setPlayer(null); navigate('/players') }}
        onSwitchWorld={() => { setWorld(null); navigate('/') }}
      />
    </div>
  )
}
