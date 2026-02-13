import type { Quest } from '../../types'
import { Card } from '../UI/Card'

interface QuestCardProps {
  quest: Quest
}

export function QuestCard({ quest }: QuestCardProps) {
  const progressPct = quest.target > 0 ? Math.min(100, (quest.progress / quest.target) * 100) : 0

  return (
    <Card className={`${quest.completed ? 'border-green-500/50 bg-green-900/20' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              {quest.quest_type.replace('_', ' ')}
            </span>
            {quest.completed && <span className="text-green-400 text-xs font-bold">COMPLETE</span>}
          </div>
          <p className="text-slate-200 text-sm">{quest.description}</p>
        </div>
        <div className="text-right text-sm text-slate-400 min-w-[60px]">
          {Math.round(quest.progress)}/{Math.round(quest.target)}
        </div>
      </div>
      <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${quest.completed ? 'bg-green-500' : 'bg-amber-500'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </Card>
  )
}
