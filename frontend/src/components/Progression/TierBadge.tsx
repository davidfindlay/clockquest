import { getTierByIndex } from '../../utils/tier-config'

interface TierBadgeProps {
  tier: number
  size?: 'sm' | 'md' | 'lg'
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const info = getTierByIndex(tier)
  const sizes = { sm: 'text-xs px-2 py-1', md: 'text-sm px-3 py-1.5', lg: 'text-base px-4 py-2' }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-bold ${sizes[size]}`}
      style={{ backgroundColor: info.color + '30', color: info.color, border: `2px solid ${info.color}` }}
    >
      {info.name}
    </span>
  )
}
