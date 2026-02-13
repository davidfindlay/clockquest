import { getTierByIndex } from '../../utils/tier-config'

interface TierProgressProps {
  clockPower: number
  currentTier: number
}

export function TierProgress({ clockPower, currentTier }: TierProgressProps) {
  const tierInfo = getTierByIndex(currentTier)
  const nextTier = currentTier < 10 ? getTierByIndex(currentTier + 1) : null
  const tierFloor = currentTier * 100
  const tierCeiling = nextTier ? (currentTier + 1) * 100 : 1000
  const progress = ((clockPower - tierFloor) / (tierCeiling - tierFloor)) * 100

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-slate-400 mb-1">
        <span>{tierInfo.name} ({tierFloor})</span>
        {nextTier && <span>{nextTier.name} ({tierCeiling})</span>}
      </div>
      <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: tierInfo.color,
          }}
        />
      </div>
      <div className="text-center mt-1 text-lg font-bold" style={{ color: tierInfo.color }}>
        {Math.round(clockPower)} / {tierCeiling}
      </div>
    </div>
  )
}
