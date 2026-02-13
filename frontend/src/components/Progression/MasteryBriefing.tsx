import type { PlayerBriefing } from '../../types'
import { TierBadge } from './TierBadge'
import { TierProgress } from './TierProgress'
import { QuestCard } from './QuestCard'
import { Button } from '../UI/Button'
import { getTierByIndex } from '../../utils/tier-config'

interface MasteryBriefingProps {
  briefing: PlayerBriefing
  onStartQuest: () => void
  onStartTrial: () => void
  onLeaderboard: () => void
  onSwitchPlayer: () => void
  onSwitchWorld: () => void
}

export function MasteryBriefing({ briefing, onStartQuest, onStartTrial, onLeaderboard, onSwitchPlayer, onSwitchWorld }: MasteryBriefingProps) {
  const { player, next_tier_name, next_tier_threshold, mastered_skills, quests } = briefing
  const trialReady = next_tier_threshold !== null && player.clock_power >= next_tier_threshold

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto">
      {/* Player header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{player.nickname}</h1>
        <TierBadge tier={player.current_tier} size="lg" />
      </div>

      {/* Clock Power */}
      <div className="text-center">
        <div className="text-5xl font-bold text-amber-400 font-mono">
          {Math.round(player.clock_power)}
        </div>
        <div className="text-slate-400">Clock Power</div>
      </div>

      {/* Tier progress */}
      <TierProgress clockPower={player.clock_power} currentTier={player.current_tier} />

      {/* Mastered skills */}
      {mastered_skills.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">Mastered Skills</h3>
          <div className="flex flex-wrap gap-2">
            {mastered_skills.map(skill => (
              <span key={skill} className="text-xs bg-slate-700 text-slate-300 rounded-lg px-3 py-1">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next tier */}
      {next_tier_name && next_tier_threshold && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-500 mb-1">Next Tier</div>
          <div className="text-2xl font-bold inline-flex items-center gap-2">
            <img
              src={getTierByIndex(player.current_tier + 1).icon}
              alt={next_tier_name}
              width={48}
              height={48}
            />
            {next_tier_name} ({next_tier_threshold})
          </div>
          {trialReady && (
            <div className="text-green-400 text-sm mt-1">You&apos;re ready for the trial!</div>
          )}
        </div>
      )}

      {/* Quests */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">Quests</h3>
        <div className="flex flex-col gap-3">
          {quests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-2">
        {trialReady && (
          <Button onClick={onStartTrial} size="lg" className="w-full">
            Attempt {next_tier_name} Trial
          </Button>
        )}
        <Button onClick={onStartQuest} size="lg" className="w-full">
          Start Quest Run
        </Button>
        <Button variant="secondary" onClick={onLeaderboard} className="w-full">
          Leaderboard
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onSwitchPlayer} className="flex-1">
            Switch Player
          </Button>
          <Button variant="ghost" size="sm" onClick={onSwitchWorld} className="flex-1">
            Change World
          </Button>
        </div>
      </div>
    </div>
  )
}
