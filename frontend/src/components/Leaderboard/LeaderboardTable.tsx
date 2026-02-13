import type { LeaderboardEntry } from '../../types'
import { TierBadge } from '../Progression/TierBadge'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentPlayerId?: number
}

export function LeaderboardTable({ entries, currentPlayerId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <div className="text-center text-slate-500 py-8">No players yet</div>
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-slate-500 text-sm border-b border-slate-700">
            <th className="py-3 px-2">#</th>
            <th className="py-3 px-2">Player</th>
            <th className="py-3 px-2">Tier</th>
            <th className="py-3 px-2 text-right">Clock Power</th>
            <th className="py-3 px-2 text-right">Weekly</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr
              key={entry.player_id}
              className={`border-b border-slate-800 ${
                entry.player_id === currentPlayerId ? 'bg-amber-500/10' : ''
              }`}
            >
              <td className="py-3 px-2 font-bold text-slate-400">{entry.rank}</td>
              <td className="py-3 px-2 font-bold">{entry.nickname}</td>
              <td className="py-3 px-2"><TierBadge tier={entry.current_tier} size="sm" /></td>
              <td className="py-3 px-2 text-right font-mono text-amber-400">{Math.round(entry.clock_power)}</td>
              <td className="py-3 px-2 text-right text-green-400">+{Math.round(entry.weekly_gain)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
